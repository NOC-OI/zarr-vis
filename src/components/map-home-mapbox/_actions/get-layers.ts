import { keyable } from '@/entities/models/keyable';
import { AddCanvasLayer } from '@/lib/map-layers/addCanvasLayer';
import { GetCOGLayer } from '@/lib/map-layers/addGeoraster';
import { GetZarrLayer } from '@/lib/map-layers/addZarrLayer';
import { colormapBuilder } from '@/lib/map-layers/jsColormaps';
import { defaultOpacity } from '@/lib/map-layers/utils';
import { ZarrLayer } from 'zarr-gl';

export async function generateSelectedLayer(
  actualLayer: string[],
  selectedLayers: keyable,
  map: any,
  windyLayerRef: any = null
) {
  for (const actual of actualLayer) {
    const layerName = selectedLayers[actual];
    const layerId = actual;

    if (map.current && map.current.getLayer(layerId)) {
      map.current.removeLayer(layerId);
      if (map.current.getSource(layerId)) {
        map.current.removeSource(layerId);
      }
    }

    // const bounds = getBoundsFromBBox(layerName.bbox) as [[number, number], [number, number]];
    try {
      let layer: keyable = {};
      if (layerName.dataType === 'WMS') {
        layer = await getWMSLayer(layerName, actual);
      } else if (layerName.dataType === 'COG') {
        layer = await getCOGLayer(layerName, actual);
      } else if (layerName.dataType === 'carbonplan') {
        layer = await getZARRCarbonplanLayer();
      } else if (layerName.dataType === 'zarrgl') {
        layer = await getZARRGLLayer(layerName, actual, map);
      } else if (layerName.dataType === 'ZARR') {
        layer = await getZarrLayer(layerName, actual);
      } else if (layerName.dataType.includes('velocity')) {
        await getVelocityLayer(layerName, map, windyLayerRef);
      }
      if (Object.keys(layer).length > 0 && !layerName.dataType.includes('velocity')) {
        if (map.current) {
          if (layerName.dataType === 'zarrgl') {
            map.current.addLayer(layer);
          } else {
            map.current.addSource(layer.id, layer.source);
            map.current.addLayer({
              id: layer.id,
              type: layer.source.type,
              source: layer.id
            });
          }
        }
      }
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Error adding layer' };
    }
    // if (map.current) {
    //   map.current.fitBounds(bounds, { padding: 20, animate: true });
    // }
  }
}

export async function getZARRCarbonplanLayer() {
  console.log('This layer is handled in the REGL');
  return {};
}

export async function getZARRGLLayer(layerName: keyable, actual: string, map: any) {
  const selector = {};
  Object.keys(layerName.dimensions).forEach((key: string) => {
    selector[key] = layerName.dimensions[key].selected || 1;
  });

  const layer = new ZarrLayer({
    id: actual,
    type: 'custom',
    source: layerName.url,
    variable: layerName.params.variable || 'vo',
    version: 'v2',
    selector: selector,
    colormap: colormapBuilder(layerName.colors || 'viridis'),
    vmin: layerName.scale ? layerName.scale[0] : 0,
    vmax: layerName.scale ? layerName.scale[1] : 1,
    opacity: layerName.opacity || defaultOpacity,
    map: map.current
  });
  return layer;
}

export async function getVelocityLayer(layerName: keyable, map: any, windyLayerRef: any) {
  if (windyLayerRef?.current) {
    await windyLayerRef.current.create(layerName, map);
  } else {
    const getCanvasLayer = new AddCanvasLayer();
    await getCanvasLayer.create(layerName, map);
    windyLayerRef.current = getCanvasLayer;
  }
}

export async function getZarrLayer(layerName: keyable, actual: string) {
  const zarrLayerClass = new GetZarrLayer(layerName, actual);
  const layer = await zarrLayerClass.getTile();
  return layer;
}

export async function getCOGLayer(layerName: keyable, actual: string) {
  const getCOGLayer = new GetCOGLayer(layerName, actual, 'mapbox');
  const layer = await getCOGLayer.getTile();
  return layer;
}

export async function getWMSLayer(layerName: keyable, actual: string) {
  const layerParams = Array.isArray(layerName.params.layers)
    ? layerName.params.layers[2]
    : layerName.params.layers;

  const query = new URLSearchParams({
    service: 'WMS',
    request: 'GetMap',
    version: '1.3.0',
    layers: layerParams,
    styles: layerName.colors || '',
    format: 'image/png',
    transparent: 'true',
    height: '256',
    width: '256',
    crs: 'EPSG:3857'
  });
  if (layerName.dimensions) {
    Object.keys(layerName.dimensions).forEach(dimension => {
      const selectedDimension =
        layerName.dimensions[dimension].values[layerName.dimensions[dimension].selected];
      query.append(dimension, selectedDimension);
    });
  }
  const tileUrl = `${layerName.url}?${query.toString()}&bbox={bbox-epsg-3857}`;

  const layer = {
    id: actual,
    source: {
      type: 'raster',
      tiles: [tileUrl],
      tileSize: 256
    }
  };
  return layer;
}
