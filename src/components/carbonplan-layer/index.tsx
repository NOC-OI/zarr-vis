'use client';

import { keyable } from '@/entities/models/keyable';
import Regl from '@/lib/carbonplan/regl';
import { colormapBuilder } from '@/lib/map-layers/jsColormaps';
import { defaultOpacity } from '@/lib/map-layers/utils';
import { ColorModeProvider } from '@theme-ui/color-modes';
import { useMemo } from 'react';
import { LoadingProvider, LoadingUpdater } from '../../lib/carbonplan/loading';
import Raster from '../../lib/carbonplan/raster';

interface CarbonplanLayerProps {
  layerInfo: any;
}

export function CarbonplanLayer({ layerInfo }: CarbonplanLayerProps) {
  const colorMapName = layerInfo?.colors || 'viridis';
  const colormap = colormapBuilder(colorMapName);

  const opacity = layerInfo?.opacity ?? defaultOpacity;
  const selector: keyable = useMemo(() => {
    if (!layerInfo?.dimensions) return {};
    const localSelector: keyable = {};
    Object.keys(layerInfo.dimensions).forEach((key: string) => {
      localSelector[key] = layerInfo.dimensions[key].selected || 1;
    });
    return localSelector;
  }, [layerInfo]);

  const variable = layerInfo?.params?.variable;
  const scale = layerInfo?.scale || [0, 1];

  return (
    <Regl
      style={{
        position: 'absolute',
        pointerEvents: 'none'
      }}
    >
      <ColorModeProvider>
        <LoadingProvider>
          <LoadingUpdater
            setLoading={undefined}
            setMetadataLoading={undefined}
            setChunkLoading={undefined}
          />
          <Raster
            colormap={colormap}
            display={true}
            clim={scale}
            opacity={opacity}
            source={layerInfo.url}
            variable={variable}
            selector={selector}
          />
        </LoadingProvider>
      </ColorModeProvider>
    </Regl>
  );
}
