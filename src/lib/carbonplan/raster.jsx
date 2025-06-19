/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { useMapbox } from '@/components/map-home-mapbox';
import { useEffect, useRef, useState } from 'react';
import { useSetLoading } from './loading';
import { useRegl } from './regl';
import { createTiles } from './tiles';
import { useControls } from './use-controls';

const Raster = props => {
  const {
    display = true,
    opacity = 1,
    clim,
    index = 0,
    selector = {},
    uniforms = {},
    colormap
  } = props;
  const { center, zoom } = useControls();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [regionDataInvalidated, setRegionDataInvalidated] = useState(new Date().getTime());
  const { regl } = useRegl();
  const { map } = useMapbox();
  const { setLoading, clearLoading, loading, chunkLoading, metadataLoading } = useSetLoading();
  const tiles = useRef();
  const camera = useRef();

  camera.current = { center, zoom };

  useEffect(() => {
    tiles.current = createTiles(regl, {
      ...props,
      setLoading,
      clearLoading,
      invalidate: () => {
        map.triggerRepaint();
      },
      invalidateRegion: () => {
        setRegionDataInvalidated(new Date().getTime());
      }
    });
  }, []);

  useEffect(() => {
    if (props.setLoading) {
      props.setLoading(loading);
    }
  }, [!!props.setLoading, loading]);
  useEffect(() => {
    if (props.setMetadataLoading) {
      props.setMetadataLoading(metadataLoading);
    }
  }, [!!props.setMetadataLoading, metadataLoading]);
  useEffect(() => {
    if (props.setChunkLoading) {
      props.setChunkLoading(chunkLoading);
    }
  }, [!!props.setChunkLoading, chunkLoading]);

  useEffect(() => {
    const callback = () => {
      if (Object.values(camera.current).some(Boolean)) {
        tiles.current.updateCamera(camera.current);
        tiles.current.draw();
      }
    };
    map.on('render', callback);

    return () => {
      regl.clear({
        color: [0, 0, 0, 0],
        depth: 1
      });
      map.off('render', callback);
      map.triggerRepaint();
    };
  }, [index]);

  useEffect(() => {
    tiles.current.updateSelector({ selector });
  }, [selector]);

  useEffect(() => {
    tiles.current.updateUniforms({ display, opacity, clim, ...uniforms });
  }, [display, opacity, clim, uniforms]);

  useEffect(() => {
    tiles.current.updateColormap({ colormap });
  }, [colormap]);

  return null;
};

export default Raster;
