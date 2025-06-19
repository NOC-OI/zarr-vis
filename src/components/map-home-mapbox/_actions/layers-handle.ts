import { keyable } from '@/entities/models/keyable';
import { defaultWMSBoundsMapbox } from '@/lib/map-layers/utils';
import { generateSelectedLayer } from './get-layers';

export function getBoundsFromBBox(bbox: number[] | null): [[number, number], [number, number]] {
  if (!bbox || bbox.length !== 4) return defaultWMSBoundsMapbox;
  const sumValue = 0.1;
  bbox[0] = bbox[0] - sumValue < -180 ? -180 : bbox[0] - sumValue;
  bbox[1] = bbox[1] - sumValue < -90 ? -90 : bbox[1] - sumValue;
  bbox[2] = bbox[2] + sumValue > 180 ? 180 : bbox[2] + sumValue;
  bbox[3] = bbox[3] + sumValue > 90 ? 90 : bbox[3] + sumValue;
  return [
    [bbox[0], bbox[1]],
    [bbox[2], bbox[3]]
  ];
}

export function removeLayerFromMap(actualLayer: string[], map: any, windyLayerRef: any): void {
  const layerId = actualLayer[0];
  if (layerId.includes('canvas')) {
    windyLayerRef.current?.remove(map);
  } else {
    if (map.current.getLayer(layerId)) {
      map.current.removeLayer(layerId);
    }
    if (map.current.getSource(layerId)) {
      map.current.removeSource(layerId);
    }
  }
}

export async function changeMapZoom(actualLayer: string[], selectedLayers: keyable, map: any) {
  const layerIds = Array.isArray(actualLayer) ? actualLayer : [actualLayer];

  for (const id of layerIds) {
    const layerInfo = selectedLayers[id];
    if (!layerInfo) continue;

    const bounds = getBoundsFromBBox(layerInfo.bbox) as [[number, number], [number, number]];

    if (map.current.getLayer(id)) {
      map.current.moveLayer(id);
    }
    map.current.fitBounds(bounds, { padding: 20 });

    break;
  }
}

export async function changeMapOpacity(
  actualLayer: string[],
  selectedLayers: keyable,
  map: any,
  windyLayerRef: any
) {
  const layerIds = Array.isArray(actualLayer) ? actualLayer : [actualLayer];

  for (const id of layerIds) {
    const layerInfo = selectedLayers[id];
    if (!layerInfo) continue;
    if (typeof layerInfo.opacity !== 'number') {
      layerInfo.opacity = parseFloat(layerInfo.opacity);
    }

    if (selectedLayers[id].dataType === 'zarrgl') {
      removeLayerFromMap([id], map, windyLayerRef);
      await generateSelectedLayer([id], selectedLayers, map);
    } else if (selectedLayers[id].dataType.includes('velocity')) {
      if (windyLayerRef.current) {
        windyLayerRef.current?.remove(map);
        await generateSelectedLayer([id], selectedLayers, map, windyLayerRef);
      }
    } else {
      const opacity = layerInfo.opacity;

      const mapStyleLayers = map.current.getStyle().layers;

      for (const styleLayer of mapStyleLayers) {
        if (styleLayer.id.includes(id)) {
          const type = styleLayer.type;
          if (type === 'fill') {
            map.current.setPaintProperty(styleLayer.id, 'fill-opacity', opacity);
          } else if (type === 'line') {
            map.current.setPaintProperty(styleLayer.id, 'line-opacity', opacity);
          } else if (type === 'circle') {
            map.current.setPaintProperty(styleLayer.id, 'circle-opacity', opacity);
          } else if (type === 'symbol') {
            map.current.setPaintProperty(styleLayer.id, 'icon-opacity', opacity);
            map.current.setPaintProperty(styleLayer.id, 'text-opacity', opacity);
          } else if (type === 'raster') {
            map.current.setPaintProperty(styleLayer.id, 'raster-opacity', opacity);
          } else if (type === 'fill-extrusion') {
            map.current.setPaintProperty(styleLayer.id, 'fill-extrusion-opacity', opacity);
          } else if (type === 'custom') {
            map.current.setPaintProperty(styleLayer.id, 'custom-opacity', opacity);
          }
        }
      }
    }
  }
}

export async function changeMapColors(actualLayer: string[], selectedLayers: keyable, map: any) {
  const layerToBeChanged = Array.isArray(actualLayer) ? actualLayer[0] : actualLayer;
  if (map.current.getLayer(layerToBeChanged)) {
    map.current.removeLayer(layerToBeChanged);
  }
  if (map.current.getSource(layerToBeChanged)) {
    map.current.removeSource(layerToBeChanged);
  }
  return await generateSelectedLayer(actualLayer, selectedLayers, map);
}

export async function changeMapDate(actualLayer: string[], selectedLayers: keyable, map: any) {
  const layerToBeChanged = Array.isArray(actualLayer) ? actualLayer[0] : actualLayer;
  const layers = map.current.getStyle().layers;

  for (const styleLayer of layers) {
    if (styleLayer.id.includes(layerToBeChanged)) {
      let sourceId;
      if (map.current.getLayer(styleLayer.id)) {
        sourceId = (map.current.getLayer(styleLayer.id) as mapboxgl.RasterLayer)?.source;
        map.current.removeLayer(styleLayer.id);
      }
      if (sourceId && map.current.getSource(sourceId)) {
        map.current.removeSource(sourceId);
      }
    }
  }
  return await generateSelectedLayer(actualLayer, selectedLayers, map);
}
