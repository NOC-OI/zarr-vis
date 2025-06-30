'use client';

import mapboxgl from 'mapbox-gl';

import { useContextHandle } from '@/application/context-handle';
import { useLayersManagementHandle } from '@/application/layers-management';
import { keyable } from '@/entities/models/keyable';
import { AddCanvasLayer } from '@/lib/map-layers/addCanvasLayer';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { CarbonplanLayer } from '../carbonplan-layer';
import { generateSelectedLayer } from './_actions/get-layers';
import {
  changeMapColors,
  changeMapDimensions,
  changeMapOpacity,
  changeMapZoom,
  removeLayerFromMap
} from './_actions/layers-handle';
export const MapboxContext = createContext<{ map: mapboxgl.Map | null } | null>(null);

export const useMapbox = () => {
  return useContext(MapboxContext);
};
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_API_KEY || '';

export function MapHomeMapbox() {
  const {
    selectedLayers,
    actualLayer,
    layerAction,
    setLayerAction,
    zarrLayerProps,
    windyLayerRef
  } = useLayersManagementHandle();
  const zoom = 2;
  const center: [number, number] = [0, 0];
  const { setFlashMessage, setLoading } = useContextHandle();

  const map = useRef<mapboxgl.Map | null>(null);
  const [ready, setReady] = useState(false);

  const ref = useCallback(node => {
    if (node !== null) {
      map.current = new mapboxgl.Map({
        container: node,
        style: 'mapbox://styles/mapbox/dark-v11',
        projection: 'mercator',
        dragRotate: false,
        pitchWithRotate: false,
        touchZoomRotate: true
      });
      if (zoom) map.current.setZoom(zoom);
      if (center) map.current.setCenter(center);
      map.current.touchZoomRotate.disableRotation();
      map.current.touchPitch.disable();
      map.current.on('styledata', () => {
        setReady(true);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addLayerIntoMap(windyLayerRef: AddCanvasLayer | null) {
    const error = await generateSelectedLayer(actualLayer, selectedLayers, map, windyLayerRef);
    if (error) {
      setFlashMessage({
        messageType: 'error',
        content: error.error
      });
    }
    setLayerAction('');
    setLoading(false);
  }

  async function handleLayerAction(actionMap: keyable, action: string) {
    setLoading(true);
    await actionMap[action].function(...actionMap[action].args);
    setLoading(false);
    setLayerAction('');
  }

  useEffect(() => {
    if (!map.current) return;
    const actionMap = {
      remove: { function: removeLayerFromMap, args: [actualLayer, map, windyLayerRef] },
      add: { function: addLayerIntoMap, args: [windyLayerRef] },
      zoom: { function: changeMapZoom, args: [actualLayer, selectedLayers, map] },
      opacity: {
        function: changeMapOpacity,
        args: [actualLayer, selectedLayers, map, windyLayerRef]
      },
      'update-colors': { function: changeMapColors, args: [actualLayer, selectedLayers, map] },
      'update-dimensions': {
        function: changeMapDimensions,
        args: [actualLayer, selectedLayers, map, windyLayerRef]
      }
    };
    if (actionMap[layerAction]) {
      handleLayerAction(actionMap, layerAction);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLayers]);

  return (
    <MapboxContext.Provider
      value={{
        map: map.current
      }}
    >
      <div
        style={{
          top: '0px',
          bottom: '0px',
          position: 'absolute',
          width: '100%'
        }}
        ref={ref}
      />
      {ready &&
        Object.keys(zarrLayerProps).map(layer => (
          <CarbonplanLayer key={layer} layerInfo={zarrLayerProps[layer]} />
        ))}
    </MapboxContext.Provider>
  );
}
