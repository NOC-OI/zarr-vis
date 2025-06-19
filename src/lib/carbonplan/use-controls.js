import { useMapbox } from '@/components/map-home-mapbox';
import { useCallback, useEffect, useState } from 'react';
import { flushSync } from 'react-dom';

export const useControls = () => {
  const { map } = useMapbox();
  const [zoom, setZoom] = useState(map.getZoom());
  const [center, setCenter] = useState(map.getCenter());

  const updateControlsSync = useCallback(() => {
    flushSync(() => {
      setZoom(map.getZoom());
      setCenter(map.getCenter());
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    map.on('move', updateControlsSync);
    return () => {
      map.off('move', updateControlsSync);
    };
  }, [map, updateControlsSync]);

  return { center, zoom };
};
