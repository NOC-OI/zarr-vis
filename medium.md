In recent years, cloud-native technologies have revolutionized how we store, access, and visualize data. Gone are the days when large datasets were locked away on expensive FTP servers or private data silos. Today, many research institutions and data providers are embracing **object storage** — scalable, cost-efficient, and ideal for cloud-based workflows.

Alongside this shift, modern data formats like **Zarr** have emerged to handle the demands of high-resolution, N-dimensional scientific data. But while Zarr excels at scalable storage and parallel analysis, visualizing this data efficiently in a **web browser** remains a challenge.

In this post, I explore several emerging technologies and libraries designed to bridge this gap, enabling direct-to-browser visualization of Zarr datasets. I focus on outputs from numerical ocean models, which typically include four core dimensions: latitude, longitude, depth, and time. These datasets often exceed tens or hundreds of gigabytes, making them a strong test case for scalable, browser-friendly access patterns.

I explore different strategies for visualizing Zarr-based multidimensional data on the web, focusing on tools that integrate with modern geospatial and scientific Python/JavaScript ecosystems. This includes titiler-multidim, which combines rio-tiler, rasterio, xarray, and zarr to serve multi-dimensional data via tile endpoints, as well as carbonplan/maps and zarr-gl, which leverage zarr-js, WebGL, and regl for high-performance client-side rendering. I’ll compare their design choices, rendering workflows, and performance characteristics, and highlight trade-offs between server-side preprocessing and client-side interactivity. I also build a live demo site to showcase these methods in action:

🔗 **GitHub repository:** [https://github.com/NOC-OI/zarr-vis](https://github.com/NOC-OI/zarr-vis)
🌐 **Live demo:** [https://noc-oi.github.io/zarr-vis/](https://noc-oi.github.io/zarr-vis/)

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

Yet despite its advantages for storage and computation, a key challenge remains: **How can we enable performant, flexible and scalable client-side visualization of Zarr datasets in the browser?**

Solving this requires new tooling and strategies — ones that bridge the gap between cloud-optimized data storage and responsive, interactive visualization in web environments.

## Data Sources

To evaluate and demonstrate interactive, multi-dimensional visualization workflows, this post makes use of two ocean model datasets: the Near Present Day (NPD) NEMO outputs produced by the National Oceanography Centre (NOC), and the AMM15 regional configuration developed by the UK MetOffice.

The NPD dataset offers global coverage at approximately 1/12 degrees resolution, with hourly outputs and a time lag of one to three months from the present. It is published in cloud-optimized Zarr format, with each variable stored in its own chunked and compressed group, typically around 100 MB per chunk. The dataset use Tri-Polar Grid with rotated pole coordinates (`nav_lat`, `nav_lon`). More information about this dataset can be found in the [NOC NPD documentation](https://noc-msm.github.io/NOC_Near_Present_Day/).

The AMM15 dataset, by contrast, focuses on the Northwest European Atlantic Shelf at a spatial resolution (\~1.5 km), with 6-day forecast and 33 depth levels. Generated by the MetOffice, AMM15 outputs are distributed in NetCDF format and it is on Lambert Azimuthal Equal-Area (LAEA) projection, which is a rotated pole grid. The dataset is available through the [MetOffice Marine Data service](https://www.metoffice.gov.uk/services/data/met-office-marine-data-service), which provides access to a wide range of oceanographic outputs.

Both datasets present the same fundamental challenge: multidimensional, curvilinear data must be efficiently reprojected, rechunked, and sometimes interpolated to support tiled, web-based visualization. For NetCDF sources such as AMM15, this also involves an initial format conversion. Once processed, these datasets can be served dynamically, enabling responsive exploration of ocean model outputs directly in the browser.

## Cloud-Optimized Data Pipeline for Geospatial Raster Datasets

This pipeline outlines a scalable approach for preparing 4D environmental datasets for high-performance web visualization. It transforms large, scientific raster outputs into responsive, cloud-native assets—ideal for both exploratory analysis and operational monitoring in modern browsers.

### 1. Reproject to Web-Friendly Coordinate Systems

Climate and oceanographic models frequently use non-Cartesian grids (e.g., tripolar, rotated pole, curvilinear), which are not directly compatible with standard web mapping tools like Leaflet or Mapbox, which rely on regular geographic (EPSG:4326) or Web Mercator (EPSG:3857) projections.

To bridge this gap, spatial reprojection is required. Tools like [`iris`](https://scitools-iris.readthedocs.io/) and [`xESMF`](https://xesmf.readthedocs.io/) can convert model-native grids into web-compatible ones. Here's an example using `iris`:

```python
import iris
import cartopy.crs as ccrs

cube = ds.to_iris()
cube.add_aux_coord(iris.coords.AuxCoord(ds["nav_lat"].values, "latitude", units="degrees"), (1, 2))
cube.add_aux_coord(iris.coords.AuxCoord(ds["nav_lon"].values, "longitude", units="degrees"), (1, 2))

target_crs = ccrs.PlateCarree()
projected_cube = iris.analysis.cartography.project(
    cube,
    target_crs,
    nx=ds.sizes["x"],
    ny=ds.sizes["y"],
)

reprojected_ds = xr.DataArray.from_iris(projected_cube[0])
```

This reprojection ensures compatibility with tile-based frontends and facilitates integration with map-rendering libraries.

### 2. Chunking Optimization for Web Performance

Chunking is critical to performance, especially in cloud environments and browser-based clients.

- For HPC and analytical workflows: aim for **10–100 MB** chunks.
- For web visualization: use smaller spatial chunks (\~**100–500 KB**), often matching tile sizes like **256×256** or **512×512**.

For example:

```python
ds = ds.chunk({"time": 1, "lat": 256, "lon": 256})
```

Avoid multi-dimensional chunking (e.g., chunking across both time and depth), as it complicates tile serving and animation performance.

There is a really detailed report on [Zarr Visualization](https://nasa-impact.github.io/zarr-visualization-report/) that provides detailed, use-case-driven chunking recommendations. In this report they mention that there is an decrease of performance using sharding (Zarr v3), so it is recommended to use the smaller `chunk` instead of sharding. As a result, we continue using **Zarr v2** for maximum compatibility and speed.

### 3. Build Multiscale Pyramids with `ndpyramid`

To support smooth zooming and panning, data should be converted into a multiscale pyramid—a structure widely used in tile servers.

[`ndpyramid`](https://ndpyramid.readthedocs.io/) simplifies this with a single call:

```python
from ndpyramid import pyramid_resample

pyramid_ds = pyramid_resample(
    reprojected_ds,
    x="longitude",
    y="latitude",
    levels=6,
    resampling="nearest"
)
```

This creates a nested Zarr directory like:

```
multiscale.zarr/
├── 0/    # Native resolution
├── 1/    # 2× downsampled
├── 2/    # 4× downsampled
...
```

Each resolution level is self-contained and ready to serve via `titiler-multidim`, `zarr-gl`, or `carbonplan/maps`.

### 4. Export in Zarr v2 with Consolidated Metadata

Consolidating metadata into `.zmetadata` accelerates access and is essential for most modern visualizers:

```python
pyramid_ds.to_zarr("output.zarr", consolidated=True)
```

This ensures a fast, single-call metadata load—ideal for latency-sensitive applications.

### 5. Optional: NetCDF Export for Legacy GIS Tools

To support legacy or GIS-focused tooling, you may also export a NetCDF version:

```python
reprojected_ds.to_netcdf(
    "output.nc",
    format="NETCDF4",
    engine="netcdf4",
    encoding={"variable_name": {"chunksizes": (1, 256, 256)}}
)
```

This output can be published via WMS/WMTS using a GeoServer instance. For convenience, I built a [Python API](https://github.com/NOC-OI/metoffice_data_handler/blob/dev/src/metoffice_data_handler/geoserver_connection.py) to automate layer registration with GeoServer.

### 6. Optional: COG Export

In order to test the performance of COGs, I also exported the data as Cloud Optimized GeoTIFFs (COGs) using `rasterio`:

```python
da = da.sortby('y', ascending=False)
da = da.rio.write_crs("EPSG:4326", inplace=False)
for t_idx in range(da.sizes['time_counter']):
    slice_2d = da.isel(time_counter=t_idx)
    t_str = np.datetime_as_string(slice_2d.time_counter.values, unit='D')
    fname = f"{t_str}.tif"
    s3_path = f"s3_file_path/{fname}"
    slice_2d = slice_2d.rio.reproject(
        dst_crs="EPSG:3857",
        shape=(slice_2d.sizes['y'], slice_2d.sizes['x']),
    )
    slice_2d.rio.to_raster(
        raster_path=fname,
        driver="COG",
        BIGTIFF="YES",
        COMPRESS="LZW",
        OVERVIEW_RESAMPLING="nearest",
    )
```

There were created one COG file for each time step, which can be served via a static file server or object storage. This that will be served to the browser thourgh a dinamyc tileserver based on `titiler`.

## Strategies for Browser-Based Visualization of Zarr Datasets

With the rise of modern geospatial libraries like **rio-tiler**, **TiTiler**, and **Carbonplan’s Zarr visualization stack**, two primary strategies have emerged for rendering Zarr data directly in the browser. Initially, I used **Leaflet** for map rendering. However, due to limitations in Carbonplan’s viewer and the early API of Zarr-gl, I transitioned to **Mapbox GL JS**, which offers superior support for canvas and WebGL-based layers.

This post details the visualization methods I tested, evaluating their architecture, performance, and extensibility.

### 1. **Server-Side Tiling via Dynamic Tile Services**

A reliable way to visualize large Zarr datasets in the browser is by rendering tiles on the server side and streaming them to the client on demand. This strategy closely mirrors how traditional map services like WMS or WMTS operate, but is optimized for multidimensional data.

My implementation relied heavily on [**titiler-multidim**](https://github.com/developmentseed/titiler-multidim), a dynamic tile server built with FastAPI and designed to work seamlessly with **xarray** and **Zarr**. Using datasets from [NOC Near Present Day](https://noc-msm.github.io/NOC_Near_Present_Day/), I first reprojected and rechunked the data to ensure compatibility with standard XYZ tiling schemes. The data was stored in **Zarr v2** format and deployed as a tile service in a Kubernetes cluster (hosted on **JASMIN**).

This setup allowed users to request rendered map tiles on the fly—sliced across time, depth, or any other dimension—using simple HTTP endpoints. The rendered outputs could then be consumed by a range of frontend libraries, including **Mapbox**, **Leaflet**, or **OpenLayers**, offering great flexibility for integration into interactive dashboards and GIS tools.

To enhance usability, I extended `titiler-multidim` with WCS-like features, enabling requests like:

```
/wcs?url={zarr_url}&variable=temperature&date_time=2023-06-01T12:00&depth=0
```

This RESTful interface offered intuitive access patterns for both users and automated workflows. It also allowed dynamic colormap application and pixel-level inspection—crucial for scientific interpretation.

Scalability was addressed by deploying the service via **Knative**, which handled autoscaling based on demand, even scaling to zero during idle periods. A **Redis** cache layer ensured that frequently accessed tiles and metadata could be served with minimal latency, improving performance for interactive use cases and animated visualizations.

In short, this server-side architecture proved to be the most versatile and production-ready solution for Zarr visualization, balancing performance, flexibility, and extensibility without locking into a specific frontend.

### **Zarr Visualization in the Browser with WebGL and Mapbox**

To enable performant, client-side rendering of large multidimensional datasets, we adopted a browser-native architecture that leverages WebGL and Mapbox GL JS. Inspired by [Carbonplan’s viewer](https://carbonplan.org/), this implementation avoids backend infrastructure by streaming Zarr data tiles directly into the browser, offering fully static deployment and seamless integration with modern frontend frameworks.

At the core of the setup is a **custom Mapbox GL JS layer**, designed to render Zarr-based multiscale pyramids directly on the GPU using WebGL. This approach builds on the `carbonplan/maps` architecture but restructures it into a reusable, composable layer—**`CarbonplanLayer`**—plugged into our interactive `Mapbox` component.

#### 🔧 Technical Flow

- **Zarr pyramids** are prepared in advance using [`ndpyramid`](https://ndpyramid.readthedocs.io/), providing multiple resolution levels for smooth zoom transitions.
- The Zarr variable is first reprojected to WGS84 (lat/lon) and chunked appropriately for tiled access.
- Each layer is rendered using a custom `Raster` WebGL component built with Regl. It uses colormaps, alpha blending, and dimension selectors to support spatiotemporal slicing and exploration.

We manage this through a `MapboxContext`, allowing tight control over viewport sync, base map composition, and interactive state management. The WebGL rendering canvas is seamlessly layered over the Mapbox basemap, preserving performance and compatibility with pan/zoom interactions.

```tsx
<CarbonplanLayer key={layer} layerInfo={zarrLayerProps[layer]} />
```

Each layer:

- Streams chunks via HTTP directly from object storage.
- Uses Regl to render via GPU.
- Updates dynamically based on selected variables, color scales, time steps, and opacities.

#### ✅ Benefits

- **Fully static** — no backend services or APIs required.
- **Highly performant** — direct chunk access and GPU rendering.
- **Modular and extensible** — integrates easily with portals, dashboards, and time sliders.

#### ⚠️ Caveats

- Requires multiscale pyramids to be precomputed.
- Interoperability with other web standards (e.g., WMS, GeoJSON) is limited.
- Not suitable for complex server-side logic or on-the-fly transformations.

Absolutely! Here's a more balanced, less critical rewrite of the **Zarr-gl** section, incorporating your usage example and layer creation workflow:

#### 🧪 Zarr-gl: Interactive WebGL Viewer for Zarr

[**Zarr-gl**](https://github.com/ibell/zarr-gl) builds on Carbonplan’s stack with tighter Mapbox GL JS integration and chunk-level access. It enables direct, chunk-based rendering of Zarr datasets in the browser, built on top of deck.gl and tightly integrated with Mapbox GL JS. It eliminates the need for a tile server by decompressing and visualizing data client-side.

It integrates smoothly into custom Mapbox workflows. A typical layer definition uses dimension selectors and color mapping:

```ts
const layer = new ZarrLayer({
  id: actual,
  type: 'custom',
  source: layerName.url,
  variable: layerName.params.variable || 'vo',
  selector: { time: 0, depth: 1 }, // dynamic from UI
  colormap: colormapBuilder(layerName.colors || 'viridis'),
  vmin: 0,
  vmax: 1,
  opacity: 0.8,
  map: map.current
});
map.current.addLayer(layer);
```

This allows for dynamic, interactive exploration of Zarr datasets, with the ability to adjust time steps, depth levels, and color scales directly in the browser. It enables users to visualize large datasets without needing a backend tile server, making it ideal for lightweight applications or rapid prototyping. However, this library is still evolving, and some features like multiscale support and zoom behaviors may require further tuning. It is best used for scientific dashboards, fast prototyping, or advanced chunk-level exploration—especially where serverless rendering is desired.
Certainly, Tobias. Here’s a more technically refined and fluid rewrite of both the GeoServer and COG sections, along with an updated summary table that includes COG:

---

### 3. 📡 GeoServer with NetCDF: A Legacy Benchmark

As a baseline reference, I deployed **GeoServer** configured with **NetCDF** datasets within a Kubernetes environment. While this setup remains compatible with standard GIS tools and formats, it exhibits several limitations from a modern, cloud-native perspective:

* **Suboptimal for cloud environments**: NetCDF is not designed for object storage or HTTP range requests, making it inefficient in distributed or cloud-hosted scenarios.
* **Rendering performance bottlenecks**: GeoServer relies on server-side image rendering, which scales poorly compared to client-side tiled or WebGL-based visualizations.
* **Limited interactivity and scalability**: User interaction is typically constrained to basic pan-zoom operations, and real-time filtering or visualization adjustments are cumbersome.
* **Heavy and monolithic**: GeoServer lacks the lightweight, modular design favored in contemporary data pipelines, making it harder to integrate with modern APIs and visualization layers.

This approach serves legacy workflows well but lacks the flexibility and responsiveness required for modern web-based data applications.

---

### 4. 🛰️ Cloud Optimized GeoTIFFs (COGs)

As a static, performant alternative to Zarr, I evaluated **Cloud Optimized GeoTIFFs (COGs)**—a well-supported, open standard for geospatial imagery optimized for HTTP-based access. COGs enable **byte-range requests**, allowing partial file reads and seamless integration with web clients without the need for dedicated tile servers.

Key advantages:

* **Object storage–native**: Files can be hosted directly on S3 or HTTP servers and accessed efficiently by clients such as [`rasterio`](https://rasterio.readthedocs.io), [`georaster`](https://github.com/GeoTIFF/georaster), or visualized using [`titiler`](https://github.com/developmentseed/titiler).
* **Fast rendering**: Browsers and dashboards can quickly retrieve only the necessary portions of imagery, significantly improving performance.
* **Robust ecosystem support**: Many modern geospatial tools natively support reading and tiling from COGs.

However, COGs come with limitations for multidimensional datasets:

* Each time slice or vertical level typically needs to be encoded in a separate file or band, complicating data management.
* Aggregation or analysis across time or other dimensions must be done client-side or with additional indexing/metadata layers.

In this project, I generated a series of COGs—one per timestep from the NPD dataset—and served them via `titiler` for interactive exploration in the frontend. The performance was excellent, though the approach introduces complexity in organizing and querying large collections of COGs for multidimensional use cases.

---

### ✅ Summary Comparison
| Strategy                       | Backend Required | Performance          | Interactivity                  | Best Use Case                        | Key Limitation                                   |
| ------------------------------ | ---------------- | -------------------- | ------------------------------ | ------------------------------------ | ------------------------------------------------ |
| `titiler-multidim`             | ✅ Yes            | 🚀 High              | ✅ Full (sliders, queries)      | Interactive dashboards, full control | Requires custom backend setup and configuration  |
| Carbonplan Viewer              | ❌ No             | ⚡ Fast (precomputed) | 🔶 Moderate (static colormaps) | Lightweight static sites             | Fixed colormaps and limited dynamic interaction  |
| `zarr-gl`                      | ❌ No             | 🧪 Experimental      | ✅ Chunk-based control          | Scientific exploration               | Immature ecosystem, limited production readiness |
| GeoServer + NetCDF             | ✅ Yes            | 🐢 Slow              | 🔶 Basic                       | Legacy GIS workflows                 | Poor scalability and non-cloud-native            |
| Cloud-Optimized GeoTIFFs (COG) | ❌ No             | ⚡ Fast (static)      | 🔶 Moderate (via titiler)      | Static delivery, browser-based maps  | Fragmented multidimensional support              |

For code and examples, check out the GitHub repo:
🔗 [https://github.com/NOC-OI/zarr-vis](https://github.com/NOC-OI/zarr-vis)

To explore a working implementation:
🌐 [https://noc-oi.github.io/zarr-vis/](https://noc-oi.github.io/zarr-vis/)

## Additional: Visualizing Ocean Currents in MapboxGL with `wind-js` and Zarr

As part of my work with multidimensional ocean data, I needed a performant and flexible way to visualize surface current fields on interactive maps. While exploring options, I came across [windjs-over-mapbox](https://github.com/bumbeishvili/windjs-over-mapbox), a lightweight adaptation of Esri’s original `wind-js` canvas library that renders animated velocity fields over MapboxGL maps. It uses a separate canvas layer to display wind (or ocean current) animations, synchronized with the map viewport for a smooth and responsive experience.

I extended this concept to support oceanographic data served from a Zarr backend. This required a few key modifications, particularly around data loading and canvas synchronization.

### Integrating Zarr Data into `wind-js` Animations

My application uses a backend that serves ocean velocity fields (`uo`, `vo`) as Zarr tiles. To make this data usable by `wind-js`, I implemented a transformation pipeline that:

1. Fetches the U and V components separately from my Zarr-aware `WCS` service.
2. Parses the raw data into georaster-like objects.
3. Combines them into the expected `wind-js` format—an object containing a `header` (with grid metadata) and a flattened `data` array.

Here’s a simplified example of how I construct the velocity payload:

```ts
const velocityData = {
  data: georaster.values,
  header: {
    parameterUnit: 'm.s-1',
    parameterNumber: dataType === 'U' ? 2 : 3,
    dx: georaster.resolution.resolutionX,
    dy: georaster.resolution.resolutionY,
    parameterNumberName: dataType === 'U' ? 'Eastward currents' : 'Northward currents',
    la1: georaster.bbox[3],
    la2: georaster.bbox[1],
    parameterCategory: 2,
    lo1: georaster.bbox[0],
    lo2: georaster.bbox[2],
    nx: georaster.width,
    ny: georaster.height
  }
};
```

Both `uo` and `vo` components are then passed to the `Windy` object.

### Creating a Canvas Layer in MapboxGL

To render the velocity field, I dynamically create a `<canvas>` element and append it to the Mapbox container. This canvas layer is positioned absolutely, sized to match the viewport, and styled for transparency and interactivity:

```ts
this.canvas = document.createElement('canvas');
this.canvas.style.position = 'absolute';
this.canvas.style.top = '0';
this.canvas.style.left = '0';
this.canvas.style.zIndex = '19';
this.canvas.style.pointerEvents = 'none';
```

Using `map.current.getCanvas()` and `getContainer()`, I align the canvas dimensions precisely with the Mapbox map. Then I instantiate the `Windy` renderer using the preprocessed `uo` and `vo` data:

```ts
this.windy = new (window as any).Windy({
  canvas: this.canvas,
  data: [velocityDataU, velocityDataV]
});
map.current.getContainer().appendChild(this.canvas);
```

### Syncing Wind Animation with Map Movement

To ensure fluid interaction, I register several map events—`resize`, `move`, `zoom`, and `moveend`. On each of these, I reset the canvas layer by:

- Resizing the canvas to match the viewport.
- Fetching the current bounds and zoom level.
- Restarting the `wind-js` animation with updated coordinates and a zoom-dependent particle size.

The `resetWind()` function encapsulates this logic, including dynamic adjustment of particle line width based on zoom level for visual clarity and performance:

```ts
this.windy.start(
  [
    [0, 0],
    [width, height]
  ],
  width,
  height,
  [
    [west, south],
    [east, north]
  ],
  { particleLineWidth: particleWidth }
);
```

This setup provides a responsive, performant, and visually compelling way to explore time-varying ocean surface currents.

---

### Why This Matters

By integrating Zarr-backed ocean data with `wind-js` over Mapbox, I’ve created a lightweight, scalable approach for animating large geospatial datasets in the browser. It offers a great balance between interactivity and performance, and can be extended easily for wind or current data from other sources such as WCS or GeoServer endpoints.

Whether for operational oceanography, educational tools, or interactive dashboards, this method bridges high-resolution Earth data with modern web-based visualization.

## 🧪 Live Demo

Explore the interactive demo site showcasing all the visualization techniques described:

🌍 **[https://noc-oi.github.io/zarr-vis/](https://noc-oi.github.io/zarr-vis/)**
💻 GitHub: [https://github.com/NOC-OI/zarr-vis](https://github.com/NOC-OI/zarr-vis)

The site demonstrates several different approaches:

- **Server-side tiling** using `titiler-multidim`
- **Client-side rendering** with **Carbonplan’s viewer**
- **WebGL-based rendering** using **zarr-gl**
- **Animated wind fields** with `wind-js` over **Mapbox GL JS**
- **Legacy NetCDF rendering** via **GeoServer**, for comparison

You can interactively switch between these modes, explore dataset dimensions (including time), and regenerate views on the fly. Layer colors and styles can also be customized using perceptually uniform colormaps, powered by an adapted version of [js-colormaps](https://github.com/timothygebhard/js-colormaps), inspired by `matplotlib`.

It's a hands-on way to evaluate the strengths and trade-offs of each method for browser-based exploration of Zarr and NetCDF data.

## 🧩 Final Thoughts

Zarr is becoming the backbone of modern geospatial analysis, but we still need better tools for **interactive, browser-native visualization**. These early experiments show it’s not only possible — it’s increasingly practical.

If you're publishing large-scale environmental data to the web, consider using **titiler-multidim** for backend-powered maps, or **Carbonplan-style viewers** for lightweight static sites.

Let me know what you think, and feel free to share your experience with Zarr visualization. Collaboration and feedback are very welcome!
Absolutely — here's a clearer and more polished version of that section, improving structure, grammar, and rhythm while keeping the original content and enthusiasm:

## 🙏 Acknowledgements

This project builds upon the incredible work of several open-source communities and individuals. The following libraries were essential for enabling interactive, multidimensional geospatial data visualisation in the browser:

- **[titiler-multidim](https://github.com/developmentseed/titiler-multidim)**
  A FastAPI-based tile server for multidimensional raster data. I adapted the source code to support multi-dimensional datasets more flexibly and to expose endpoints similar to a Web Coverage Service (WCS), enabling frontend-driven data selection.

- **[carbonplan/maps](https://github.com/carbonplan/maps)**
  A React-based geospatial visualization framework. I modified this library to work not as a standalone map application but as a modular, custom layer for **Mapbox GL JS**, allowing seamless integration with existing UI frameworks.

- **[zarr-gl](https://github.com/carderne/zarr-gl)**
  A WebGL-powered viewer for Zarr-based gridded data. I extended this tool to support additional color mapping and slicing capabilities suitable for oceanographic datasets.

- **[windjs-over-mapbox](https://github.com/bumbeishvili/windjs-over-mapbox)**
  A lightweight plugin to display animated wind fields over Mapbox maps. I adapted this to load canvas layers dynamically from my custom “WCS-like” tile endpoints and synchronize animations with the dataset’s time dimension.

- **[js-colormaps](https://github.com/timothygebhard/js-colormaps)**
  A set of perceptually uniform color maps ported to JavaScript. I integrated and extended this library to ensure visual consistency across WebGL, canvas, and raster tile layers in the application.

Each of these projects provided a solid foundation, and I am deeply grateful to the authors and contributors. All source code adaptations were made to meet the specific requirements of this ocean model visualization pipeline, with respect to open licenses.

This work was developed as part of the **Atlantis project**.
