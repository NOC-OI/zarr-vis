In recent years, cloud-native technologies have revolutionized how we store, access, and visualize data. Gone are the days when large datasets were locked away on expensive FTP servers or private data silos. Today, many research institutions and data providers are embracing **object storage** — scalable, cost-efficient, and ideal for cloud-based workflows.

Alongside this shift, modern data formats like **Zarr** have emerged to handle the demands of high-resolution, N-dimensional scientific data. But while Zarr excels at scalable storage and parallel analysis, visualizing this data efficiently in a **web browser** remains a challenge.

In this post, I’ll walk through my experiments with several modern tools and libraries aimed at bringing Zarr data into the browser. I’ll focus on ocean model outputs, which are datasets with latitude, longitude, depth, and time dimensions. I’ll compare the pros and cons of each approach and share a small demo site with **live visualizations of Zarr datasets**.

🔗 **GitHub repository:** [https://github.com/NOC-OI/zarr-vis](https://github.com/NOC-OI/zarr-vis)
🌐 **Live demo:** [https://noc-oi.github.io/zarr-vis/](https://noc-oi.github.io/zarr-vis/)

---

## Why Zarr Visualization Matters

Visualization is a critical component of Earth system science workflows, enabling researchers to explore, validate, and communicate complex datasets. The web browser has become a ubiquitous platform for scientific visualization, offering broad accessibility and integration with modern interfaces. However, end users increasingly expect **low-latency, interactive experiences**, which poses a significant challenge when dealing with large-scale geospatial data.

Conventional web technologies — including WebGL and JavaScript — are not designed to handle dynamic decoding, reprojection, and subsetting of multi-gigabyte datasets in real time. As a workaround, the traditional approach has relied on **pre-rendered raster tiles**, typically in the form of PNGs or preprocessed GeoTIFFs, optimized for tiled web mapping.

While effective for basic rendering, this approach introduces several technical limitations:

- **Lack of client-side control** — Visualization parameters such as color maps, projections, or variable selection are fixed by the data provider.
- **High operational overhead** — Any change in the source data or configuration requires reprocessing the full tile cache.
- **Limited interactivity** — Users are unable to perform custom analyses, adjust visualization settings, or query data beyond what is pre-encoded in the tiles.

For common formats like NetCDF or GRIB, tools such as GeoServer or ncWMS can expose tiled map services. However, these are **server-centric and not cloud-native**, typically requiring persistent infrastructure, local storage, and high I/O bandwidth — constraints that are increasingly incompatible with modern, scalable data architectures.

Recent advances in **cloud-native data formats** have fundamentally shifted how large scientific datasets are stored and accessed. Legacy models based on FTP servers or institutional repositories are being replaced with formats optimized for object storage and parallel access.

### Enter Zarr

**Zarr** is a format designed for the efficient storage of chunked, compressed N-dimensional arrays. It supports direct access over HTTP(S) and is natively compatible with object storage platforms such as Amazon S3, Google Cloud Storage, and Azure Blob Storage. Zarr is inherently well-suited to distributed and parallel workflows, making it a foundational format in cloud-based scientific computing.

It excels at representing gridded datasets common in the geosciences — such as remote sensing imagery, numerical model output, reanalysis products, and satellite-derived time series. These datasets typically span multiple dimensions (e.g., time, latitude, longitude, depth, variable), are often terabytes in size, and require **efficient chunk-based access** for both analysis and visualization.

Zarr is fully supported by modern Python-based scientific tools such as **xarray**, **Dask**, and the **Pangeo ecosystem**, enabling scalable data processing pipelines across HPC and cloud environments.

Yet despite its advantages for storage and computation, a key challenge remains:

> **How can we enable performant, flexible, client-side visualization of Zarr datasets in the browser?**

Solving this requires new tooling and strategies — ones that bridge the gap between cloud-optimized data storage and responsive, interactive visualization in web environments.

---

## 🌊 Demonstrating Zarr Visualization with NPD and AMM15 Ocean Model Data

To evaluate and demonstrate interactive, multi-dimensional visualization workflows, this project makes use of two high-resolution ocean model datasets: the Near Present Day (NPD) NEMO outputs produced by the National Oceanography Centre (NOC), and the AMM15 regional configuration developed by the UK Met Office.

The NPD dataset offers global coverage at approximately 1.5 km resolution, with hourly outputs and a time lag of one to three months from the present. It is published in cloud-optimized Zarr format, with each variable stored in its own chunked and compressed group, typically around 100 MB per chunk. The full dataset currently spans over 1.5 TB and uses a tripolar stereographic projection with rotated pole coordinates (`nav_lat`, `nav_lon`). This format makes the data readily accessible for scalable analysis and visualization through modern tooling such as xarray, Dask, and WebGL-based frontends.

The AMM15 dataset, by contrast, focuses on the Northwest European Shelf at a similar spatial resolution (\~1.5 km). Generated by the Met Office, it is widely used for both research and operational applications involving shelf sea dynamics. AMM15 outputs are distributed in NetCDF format, with each variable stored in a separate file. Though not cloud-native by default, these files can be converted to Zarr to facilitate high-performance, browser-based visualization. As with NPD, the data is 4D — including time, depth, latitude, and longitude — and is defined on a rotated pole grid.

Both datasets present the same fundamental challenge: multidimensional, curvilinear data must be efficiently reprojected, rechunked, and sometimes interpolated to support tiled, web-based visualization. For NetCDF sources such as AMM15, this also involves an initial format conversion. Once processed, these datasets can be served dynamically, enabling responsive exploration of ocean model outputs directly in the browser.

---

## 📦 Cloud-Optimized Data Pipeline for Geospatial Raster Datasets

Efficient browser-based visualization of large-scale geospatial datasets—such as ocean model outputs or satellite imagery—requires transforming raw scientific data into cloud-native formats optimized for tiled access and multiscale rendering. The following pipeline outlines a robust method for preparing 4D environmental data for performant web visualization.

### 1. Reprojection to Web-Compatible Grids

Oceanographic and climate models often use native, non-Cartesian grids (e.g., rotated poles, tripolar, or curvilinear coordinates), which are incompatible with web-based rendering frameworks relying on regular lat/lon (EPSG:4326) or Web Mercator (EPSG:3857).

To enable alignment with mapping libraries such as Leaflet or Mapbox:

- Apply spatial reprojection using tools like `xESMF`, `pyresample`, or `rioxarray`.
- Use interpolation methods appropriate to the data type: `bilinear` or `conservative` for continuous fields, `nearest` for categorical or index-based data.
- Account for coordinate system metadata and possible grid staggering (e.g., Arakawa-C grid layouts).

Example using `xESMF`:

```python
import xarray as xr
import xesmf as xe

ds = xr.open_zarr("input.zarr")
target_grid = xr.Dataset(...)  # Define regular lat/lon grid
regridder = xe.Regridder(ds, target_grid, method="bilinear")
ds_reproj = regridder(ds)
```

Reprojection introduces interpolation artifacts and potential resolution loss; this step should therefore be performed conservatively, ideally as a one-time operation.

---

### 2. Chunking Optimization for Web Performance

The Zarr format enables efficient, HTTP-range-based access to compressed N-dimensional arrays. However, chunk layout critically affects both read performance and cost, especially for interactive applications.

- For **interactive analysis or HPC**, target chunk sizes of **10–100 MB**.
- For **web visualization**, use smaller chunks (\~100–500 KB), aligned with tile boundaries (e.g., 256×256 or 512×512 spatial chunks).

Recommended chunking:

```python
ds = ds.chunk({"time": 1, "lat": 256, "lon": 256})
```

Avoid chunking across multiple dimensions simultaneously, and ensure the `time` and `depth` axes remain separable when serving animations or vertical profiles.

---

### 3. Multiscale Pyramid Generation (`ndpyramid`)

To support real-time zooming and panning, datasets should be preprocessed into multiscale pyramids. This mimics the approach used in tile-based mapping, reducing load time at coarse zoom levels.

[`ndpyramid`](https://ndpyramid.readthedocs.io/) creates multiscale Zarr hierarchies through recursive coarsening:

```python
from ndpyramid import pyramid

multiscale = pyramid(ds, method="coarsen", coarsen_kwargs={"boundary": "pad"})
multiscale.to_multiscale("multiscale.zarr")
```

Output structure:

```
multiscale.zarr/
├── 0/    # Full resolution
├── 1/    # 2× downsampled
├── 2/    # 4× downsampled
```

Each level is a self-contained Zarr group, accessible via tile servers such as `titiler-multidim` or frontend renderers like `zarr-gl`.

---

### 4. Export in Zarr v2 with Consolidated Metadata

The multiscale dataset is saved in **Zarr v2** format with consolidated metadata (`.zmetadata`), enabling high-performance metadata lookup and compatibility with visualization tools.

```python
ds.to_zarr("output.zarr", consolidated=True)
```

Zarr v2 remains the de facto standard for web-based geospatial processing. Use compression (e.g., Blosc, Zlib) to minimize storage and transfer latency.

---

### 5. Optional: Export Chunked NetCDF for GIS Interoperability

While Zarr is optimal for cloud-native workflows, legacy GIS tools and services such as GeoServer often require NetCDF input. To maintain compatibility:

```python
ds.to_netcdf(
    "output.nc",
    format="NETCDF4",
    engine="netcdf4",
    encoding={"variable_name": {"chunksizes": (1, 256, 256)}}
)
```

The resulting NetCDF file can be published via WMS/WMTS endpoints, facilitating integration with QGIS, ArcGIS, or browser-based GIS clients.

---

This preprocessing pipeline enables scalable, low-latency visualization of multi-terabyte geospatial datasets in modern browsers—transforming raw scientific output into responsive, cloud-optimized assets suitable for both exploratory and operational use cases.

---

## Strategies for Browser-Based Visualization of Zarr Datasets

With the rise of modern geospatial libraries like **rio-tiler**, **TiTiler**, and **Carbonplan’s Zarr visualization stack**, two primary strategies have emerged for rendering Zarr data directly in the browser:

Initially, I used **Leaflet** for map rendering. However, due to limitations in Carbonplan’s viewer and the early API of Zarr-gl, I transitioned to **Mapbox GL JS**, which offers superior support for canvas and WebGL-based layers.

This post details the visualization methods I tested, evaluating their architecture, performance, and extensibility.

---

### 1. **Server-Side Tiling via Dynamic Tile Services**

This architecture uses a backend service (typically Python-based) to:

- Open and process Zarr datasets using **xarray**
- Reproject the data on-the-fly
- Dynamically serve rendered tiles (e.g., PNGs or NetCDF snippets) over standard tile endpoints

This approach mimics the behavior of WMS/WMTS, with added flexibility for multidimensional data.

> ✅ Scalable and performant; works with any frontend
> ❌ Requires backend infrastructure

#### 🧩 `titiler-multidim`: Xarray-Powered Dynamic Tile Server

My primary solution utilized [**titiler-multidim**](https://github.com/developmentseed/titiler-multidim), a high-performance tile server built on FastAPI and designed to slice multi-dimensional arrays from Zarr sources.

**Implementation highlights:**

- Used Zarr datasets from [NOC Near Present Day](https://noc-msm.github.io/NOC_Near_Present_Day/)
- Reprojected to a regular lat/lon grid and rechunked to tile-friendly sizes (<1 MB)
- Stored as Zarr v2 for maximum compatibility
- Deployed to a **Kubernetes cluster** (JASMIN) with:

  - Support for slicing over arbitrary dimensions (e.g., `time`, `depth`)
  - A lightweight REST-based interface for on-demand tile generation and pixel-level inspection

> ✅ **Most versatile approach** — backend-rendered tiles, pluggable with any web map frontend (Mapbox, Leaflet, OpenLayers), and natively integrates with Python data processing workflows

#### Extending `titiler-multidim`: Dynamic WCS-like Access

While `titiler-multidim` supports basic XYZ tiling and multiscale pyramids, I extended its functionality to support:

- Arbitrary dimension queries (e.g., `?time=2023-06-01T12:00&depth=0`)
- Automatic and user-defined colormap application
- A WCS-inspired tile interface using REST (rather than XML), with endpoints like:

```
/tiles/{z}/{x}/{y}.png?var=temperature&time=2023-06-01&depth=0
```

This allowed seamless integration into GIS frontends, while offering RESTful data access for analytics and animation workflows.

#### ⛴️ Scaling via Knative + Redis Caching

To ensure elasticity and cost-efficiency, the service was deployed using **Knative** in Kubernetes, with:

- Auto-scaling (including scale-to-zero) on demand
- Fine-grained scaling to match concurrent tile requests
- Redis-backed caching for:

  - Rendered tiles (PNG)
  - Metadata (time, depth availability)
  - Frequently accessed Zarr chunks

This setup achieved low-latency, high-throughput responses suitable for operational dashboards and time-based animations.

---

### 2. **Client-Side Rendering with WebGL and Zarr in Browser**

This strategy shifts all rendering to the browser. JavaScript loads Zarr chunks directly from object storage and renders them on the fly using WebGL-based visualizations.

> ✅ Fully static; no backend required
> ❌ Requires prebuilt pyramids and optimization; performance depends on browser

#### 🌐 Carbonplan Viewer: WebGL Zarr in the Browser

[**Carbonplan’s viewer**](https://carbonplan.org/) provides a JavaScript/WebGL-based solution to stream multiscale Zarr tiles directly in the browser.

**Pipeline:**

- Reprojected a Zarr variable to lat/lon
- Used [`ndpyramid`](https://ndpyramid.readthedocs.io/) to construct a 6-level multiscale pyramid
- Adapted the viewer for **Mapbox GL JS** as a custom canvas overlay

> ✅ Ideal for lightweight, static visualizations
> ❌ Limited extensibility — difficult to combine with WMS, GeoJSON, or advanced interactivity

#### Integrating with Mapbox: CarbonRasterLayer Refactor

Instead of using `carbonplan/maps` as a standalone app, I refactored it into a reusable **Mapbox GL JS layer**, enabling:

- Direct integration via `map.addLayer(...)`
- Colormap support and legend rendering
- Tight coupling with Mapbox base maps and viewport sync

```js
map.addLayer({
  id: 'zarr-tiles',
  type: 'raster',
  source: {
    type: 'raster',
    tiles: ['https://example.com/tiles/{z}/{x}/{y}.png?...'],
    tileSize: 256
  }
});
```

This enabled plug-and-play rendering of Zarr data over any base map, suitable for portals, dashboards, and time sliders.

---

#### 🧪 Zarr-gl: Experimental WebGL Visualizer

[**Zarr-gl**](https://github.com/ibell/zarr-gl) builds on Carbonplan’s stack with tighter Mapbox GL JS integration and chunk-level access.

While promising, I encountered instability with zoom handling and animation rendering. Nevertheless, the chunk-level control is compelling for scientific exploration.

> ✅ Potential for high-fidelity client-side rendering
> ❌ Currently unstable for production; requires multiscale pyramids and tuning

Key advantages:

- Full chunk access without a tile server
- Browser-side decompression and visualization
- Deck.gl/WebGL integration

I typically paired `zarr-gl` with backend tiling for flexibility, but it's a strong candidate for chunk-based, exploratory tools.

---

### 3. 📡 GeoServer + NetCDF: Legacy Comparison

As a baseline, I tested **GeoServer** with NetCDF on Kubernetes. While functional, this setup showed significant limitations:

- NetCDF is not optimized for object storage or HTTP-range requests
- GeoServer’s rendering performance lagged behind tiling and WebGL-based methods
- Interactivity and scalability were constrained

> ✅ Works with standard GIS tools
> ❌ Not cloud-native; limited performance and customization

---

### Summary

| Strategy           | Backend Required | Performance           | Interactivity                  | Best Use Case                        |
| ------------------ | ---------------- | --------------------- | ------------------------------ | ------------------------------------ |
| `titiler-multidim` | ✅ Yes           | 🚀 High               | ✅ Full (sliders, queries)     | Interactive dashboards, full control |
| Carbonplan Viewer  | ❌ No            | ⚡ Fast (precomputed) | 🔶 Moderate (static colormaps) | Lightweight static sites             |
| `zarr-gl`          | ❌ No            | 🧪 Experimental       | ✅ Chunk-based control         | Scientific exploration               |
| GeoServer          | ✅ Yes           | 🐢 Slow               | 🔶 Basic                       | Legacy GIS workflows                 |

---

For code and examples, check out the GitHub repo:
🔗 [https://github.com/NOC-OI/zarr-vis](https://github.com/NOC-OI/zarr-vis)

To explore a working implementation:
🌐 [https://noc-oi.github.io/zarr-vis/](https://noc-oi.github.io/zarr-vis/)

---

## 🌬️ Adapting `wind-js-leaflet` for MapboxGL

**Animating wind fields on canvas in Mapbox**

[`wind-js-leaflet`](https://github.com/danwild/wind-js-leaflet) is a JavaScript library that animates wind vectors from gridded u/v data using particles over a canvas.

### My Adaptation: `wind-js-mapbox`

I forked the core logic and:

- Rewrote the rendering backend to use **Mapbox's `CustomLayerInterface`** instead of Leaflet.
- Aligned canvas rendering with Mapbox’s projection system and map movement.
- Added support for **time-varying layers** (using WCS-sliced data).
- Allowed dynamic loading of wind field data as `u` and `v` from the Zarr tiles served by my backend.

### Result:

A fully interactive, animated wind layer that overlays Mapbox, updates with time, and supports variable zooms and speeds.

---

## 📡 Generating WindJS Data Format from “WCS” API

**Converting backend tile slices into WindJS-compatible data**

`wind-js` expects a very specific data format:

```js
{
  header: {
    nx: 360,
    ny: 180,
    lo1: -180.0,
    la1: 90.0,
    lo2: 180.0,
    la2: -90.0,
    dx: 1.0,
    dy: 1.0,
    refTime: "2023-06-01T00:00Z",
    parameterCategory: 2,
    parameterNumber: 2
  },
  data: [ ... array of u values ... ]
}
```

### My Pipeline:

1. Query the “WCS”-like backend:

   ```http
   /winddata?var=uo,vo&time=2023-06-01T12:00&level=10
   ```

2. Load and combine `uo` and `vo` into a single JSON blob.
3. Convert to the expected `wind-js` format (header + data array).
4. Return to frontend for direct ingestion.

Example transformation (Python):

```python
def to_windjs(u, v, time):
    header = {
        "nx": u.shape[1],
        "ny": u.shape[0],
        "lo1": lon.min(),
        "la1": lat.max(),
        "lo2": lon.max(),
        "la2": lat.min(),
        "dx": lon[1] - lon[0],
        "dy": lat[1] - lat[0],
        "refTime": time.isoformat(),
        "parameterCategory": 2,
        "parameterNumber": 2
    }
    return {
        "uComponent": {"header": header, "data": u.flatten().tolist()},
        "vComponent": {"header": header, "data": v.flatten().tolist()}
    }
```

The frontend then simply passes this to the wind canvas renderer for animation.

---

## 🧪 Live Demo

I've put together a small demo site to showcase these methods:

🌍 **[https://zarrvis.atlantis44.xyz/](https://zarrvis.atlantis44.xyz/)**
💻 GitHub repo: [https://github.com/NOC-OI/zarr-vis](https://github.com/NOC-OI/zarr-vis)

Features include:

- Side-by-side comparison of all methods
- Time-animated wind velocity layers
- Custom canvas layer integration
- WCS-like access for direct value retrieval

---

## 🔜 What’s Next?

- 📘 **Documentation**: Writing step-by-step guides on deploying Zarr tile servers and multiscale generation.
- 🔁 **IceChunk to Zarr**: Collaborating with NOC teams using [**IceChunk**](https://github.com/oceanhackweek/icechunk) to convert their data into Zarr for web viewing.
- 🌐 **Production-ready frontend**: Building a scalable Leaflet + Titiler frontend for long-term visualization of ice/ocean data.
- 🧪 **Community testing**: Open to testing other datasets using this framework — feel free to reach out if you’d like to try it!

---

## 🧩 Final Thoughts

Zarr is becoming the backbone of modern geospatial analysis, but we still need better tools for **interactive, browser-native visualization**. These early experiments show it’s not only possible — it’s increasingly practical.

If you're publishing large-scale environmental data to the web, consider using **titiler-multidim** for backend-powered maps, or **Carbonplan-style viewers** for lightweight static sites.

Let me know what you think, and feel free to share your experience with Zarr visualization. Collaboration and feedback are very welcome!

---

## 🙏 Acknowledgements

This project builds upon the incredible work of several open-source communities and individuals. The following libraries were essential for enabling interactive, multidimensional geospatial data visualisation in the browser:

- **[titiler-multidim](https://github.com/developmentseed/titiler-multidim)** by _Development Seed_
  A FastAPI-based tile server for multidimensional raster data. I adapted the source code to support multi-dimensional datasets more flexibly and to expose endpoints similar to a Web Coverage Service (WCS), enabling frontend-driven data selection.

- **[carbonplan/maps](https://github.com/carbonplan/maps)** by _CarbonPlan_
  A React-based geospatial visualization framework. I modified this library to work not as a standalone map application but as a modular, custom layer for **Mapbox GL JS**, allowing seamless integration with existing UI frameworks.

- **[zarr-gl](https://github.com/carderne/zarr-gl)** by _@caderne_
  A WebGL-powered viewer for Zarr-based gridded data. I extended this tool to support additional color mapping and slicing capabilities suitable for oceanographic datasets.

- **[windjs-over-mapbox](https://github.com/bumbeishvili/windjs-over-mapbox)** by _Bumbeishvili_
  A lightweight plugin to display animated wind fields over Mapbox maps. I adapted this to load canvas layers dynamically from my custom “WCS-like” tile endpoints and synchronize animations with the dataset’s time dimension.

- **[js-colormaps](https://github.com/timothygebhard/js-colormaps)** by _Timothy Gebhard_
  A set of perceptually uniform color maps ported to JavaScript. I integrated and extended this library to ensure visual consistency across WebGL, canvas, and raster tile layers in the application.

Each of these projects provided a solid foundation, and I am deeply grateful to the authors and contributors. All source code adaptations were made to meet the specific requirements of this ocean model visualization pipeline, with respect to open licenses.

This work is part of the Atlantis project.
