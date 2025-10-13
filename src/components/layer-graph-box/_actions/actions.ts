import { keyable } from '@/entities/models/keyable';
import * as zarr from 'zarrita';
import { Chunk, DataType } from 'zarrita';
import haversine from 'haversine-distance';

export const DIMENSION_ALIASES = {
  time: ['time', 't', 'Time', 'time_counter'],
  lat: ['lat', 'latitude', 'y', 'Latitude', 'Y'],
  lon: ['lon', 'longitude', 'x', 'Longitude', 'X', 'lng'],
  depth: ['depth', 'z', 'Depth', 'level', 'lev', 'deptht']
};

export function identifyDimensionIndices(dimNames: string[]) {
  const indices: any = {};

  for (const [key, aliases] of Object.entries(DIMENSION_ALIASES)) {
    for (let i = 0; i < dimNames.length; i++) {
      const name = dimNames[i].toLowerCase();
      if (aliases.map(a => a.toLowerCase()).includes(name)) {
        indices[key] = { name, index: i };
        break;
      }
    }
  }
  return indices;
}

const zarrArrayCache: Map<string, any> = new Map();

export async function getZarrGraphData(
  layerGraph: keyable,
  clickMapPoints: keyable,
  setGraphData: any,
  abortControllerRef: React.RefObject<AbortController | null>
) {
  if (abortControllerRef.current) {
    abortControllerRef.current.abort();
  }

  abortControllerRef.current = new AbortController();
  const signal = abortControllerRef.current.signal;

  try {
    const store = new zarr.FetchStore(layerGraph.layerInfo.url);
    const zarrGroup = await zarr.open.v2(store, { kind: 'group' });
    const variable = layerGraph.layerInfo.params.variable;
    const arrayLocation = await zarrGroup.resolve(variable);
    const zarrArray = await zarr.open(arrayLocation, { kind: 'array' });

    zarrArrayCache.set(layerGraph.layerName, {
      array: zarrArray,
      clickMapPoints: clickMapPoints
    });

    const cached = zarrArrayCache.get(layerGraph.layerName);
    if (!cached) return;

    const { array } = cached;

    const metadata = array.attrs;
    const dimNames = metadata['_ARRAY_DIMENSIONS'] || {};
    if (Object.keys(dimNames).length === 0) {
      setGraphData({
        x: [],
        y: [],
        value: [],
        dataDescription: layerGraph.layerInfo.dataDescription,
        isLoading: false,
        error: 'No dimension information found in Zarr metadata'
      });
      return;
    }
    const shape = array.shape;
    const dimIndices = identifyDimensionIndices(dimNames);
    if (
      clickMapPoints.pointsType === 'time series' &&
      dimIndices.time !== undefined &&
      dimIndices.lat !== undefined &&
      dimIndices.lon !== undefined
    ) {
      const timeSteps = shape[dimIndices.time.index];
      const lat = clickMapPoints.coords.lat;
      const lng = clickMapPoints.coords.lng;

      const height = shape[dimIndices.lat.index];
      const width = shape[dimIndices.lon.index];
      const x = Math.floor(((lng + 180) / 360) * width);
      const y = Math.floor(((90 - lat) / 180) * height);

      const timeValues = (layerGraph.dimensions?.time?.values || []).map((t: any) => {
        if (t instanceof Date) return t.getTime() / 1000;
        if (typeof t === 'string') return new Date(t).getTime() / 1000;
        return t;
      });

      setGraphData({
        lat,
        lng,
        x: [],
        y: [],
        dataDescription: layerGraph.layerInfo.dataDescription,
        name: variable,
        isLoading: true,
        totalSteps: timeSteps,
        currentStep: 0,
        error: null
      });

      const chunkSize = 10;
      for (let t = 0; t < timeSteps; t += chunkSize) {
        if (signal.aborted) return;
        const values: (number | Chunk<DataType>)[] = [];

        for (let i = t; i < Math.min(t + chunkSize, timeSteps); i++) {
          if (signal.aborted) return;
          const sliceArgs: any[] = new Array(shape.length).fill(0);
          sliceArgs[dimIndices.time.index] = i;
          sliceArgs[dimIndices.lat.index] = y;
          sliceArgs[dimIndices.lon.index] = x;
          if (dimIndices.depth !== undefined) {
            sliceArgs[dimIndices.depth.index] = 0;
          }
          const value = await zarr.get(array, sliceArgs);
          values.push(value);
        }

        if (signal.aborted) return;

        setGraphData((prevData: any) => ({
          ...prevData,
          x: [...prevData.x, ...timeValues.slice(t, t + values.length)],
          y: [...prevData.y, ...values],
          currentStep: Math.min(prevData.x.length + values.length, timeSteps),
          isLoading: t + chunkSize < timeSteps
        }));

        await new Promise(r => setTimeout(r, 10));
      }

      setGraphData((prev: any) => ({ ...prev, isLoading: false }));
    } else if (
      clickMapPoints.pointsType === 'spatial' &&
      dimIndices.lat !== undefined &&
      dimIndices.lon !== undefined &&
      dimIndices.time !== undefined
    ) {
      const coords = clickMapPoints.coords;
      const height = shape[dimIndices.lat.index];
      const width = shape[dimIndices.lon.index];

      setGraphData({
        coords,
        x: [],
        y: [],
        dataDescription: layerGraph.layerInfo.dataDescription,
        name: variable,
        isLoading: true,
        totalSteps: coords.length,
        currentStep: 0,
        error: null
      });

      const chunkSize = 10;
      const firstLat = coords[0].lat;
      const firstLng = coords[0].lng;
      for (let t = 0; t < coords.length; t += chunkSize) {
        if (signal.aborted) return;
        const values: (number | Chunk<DataType>)[] = [];
        const distancesFromFirstPoint: number[] = [];

        for (let i = t; i < Math.min(t + chunkSize, coords.length); i++) {
          if (signal.aborted) return;
          const coord = coords[i];
          const lat = coord.lat;
          const lng = coord.lng;
          const distance = haversine({ lat: firstLat, lng: firstLng }, { lat, lng }) as number;
          distancesFromFirstPoint.push(parseFloat((distance / 1000).toFixed(4))); // in km
          const x = Math.floor(((lng + 180) / 360) * width);
          const y = Math.floor(((90 - lat) / 180) * height);
          const sliceArgs: any[] = new Array(shape.length).fill(0);
          sliceArgs[dimIndices.time.index] = layerGraph.dimensions?.time?.selected || 0;
          sliceArgs[dimIndices.lat.index] = y;
          sliceArgs[dimIndices.lon.index] = x;
          if (dimIndices.depth !== undefined) {
            sliceArgs[dimIndices.depth.index] = 0;
          }
          const value = await zarr.get(array, sliceArgs);
          values.push(value);
        }
        if (signal.aborted) return;

        setGraphData((prevData: any) => ({
          ...prevData,
          x: [...prevData.x, ...distancesFromFirstPoint],
          y: [...prevData.y, ...values],
          currentStep: Math.min(prevData.x.length + values.length, coords.length),
          isLoading: prevData.x.length + values.length < coords.length
        }));
        await new Promise(r => setTimeout(r, 10));
      }
      setGraphData((prev: any) => ({ ...prev, isLoading: false }));
    }
  } catch (error: any) {
    if (error.name === 'AbortError') return;
    console.error('Error fetching Zarr data:', error);
    setGraphData((prevData: any) => ({
      ...prevData,
      isLoading: false,
      error: error.message
    }));
  }
}
