import { useEffect, useState } from 'react';

import { useMapbox } from '../../data/mapbox.js';
import { useRegion } from './region/context';

export const useRecenterRegion = () => {
  const [value, setValue] = useState({ recenterRegion: () => {} });
  const { map } = useMapbox();
  const { region } = useRegion();

  const center = region?.properties?.center;

  useEffect(() => {
    setValue({ recenterRegion: () => map.easeTo({ center }) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center]);

  return value;
};

export default useRecenterRegion;
