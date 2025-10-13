import { useLayersManagementHandle } from '@/application/layers-management';
import { faCircleXmark, faMapLocationDot } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useRef, useState } from 'react';
import Draggable from 'react-draggable';
import { getZarrGraphData } from './_actions/actions';
import { TimeSeriesGraph } from '../time-series-graph';
import { SpatialGraph } from '../spatial-graph';
import { keyable } from '@/entities/models/keyable';
import { useGraphManagementHandle } from '@/application/graph-management';

export function LayerGraphBox({}) {
  const abortControllerRef = useRef<AbortController | null>(null);
  const { selectedLayers } = useLayersManagementHandle();
  const { setClickMap, clickMap, setClickMapPoints, clickMapPoints, layerGraph, setLayerGraph } =
    useGraphManagementHandle();
  function handleClose() {
    setClickMap('');
    setClickMapPoints({});
    setLayerGraph({});
  }
  const [graphType, setGraphType] = useState('time series');
  const [graphData, setGraphData] = useState<keyable>({});
  const [spatialNumberPoints, setSpatialNumberPoints] = useState(20);

  useEffect(() => {
    if (!Object.keys(selectedLayers).includes(layerGraph.layerName)) {
      handleClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLayers]);

  useEffect(() => {
    if (Object.keys(clickMapPoints).length > 0 && layerGraph.layerInfo.url) {
      setGraphData({ x: [], y: [] });

      const dataType = clickMapPoints.pointsType;
      let coords: any = {};

      if (dataType === 'spatial') {
        const point1 = clickMapPoints.coords.point1;
        const point2 = clickMapPoints.coords.point2;
        coords = [];

        if (spatialNumberPoints === 0) {
          coords.push({ lat: point1.lat, lng: point1.lng });
          coords.push({ lat: point2.lat, lng: point2.lng });
        } else {
          const latStep = (point2.lat - point1.lat) / (spatialNumberPoints + 1);
          const lngStep = (point2.lng - point1.lng) / (spatialNumberPoints + 1);
          for (let i = 0; i < spatialNumberPoints + 2; i++) {
            coords.push({ lat: point1.lat + i * latStep, lng: point1.lng + i * lngStep });
          }
        }
      } else if (dataType === 'time series') {
        coords = clickMapPoints.coords;
      }
      abortControllerRef.current = new AbortController();
      getZarrGraphData(
        layerGraph,
        { pointsType: dataType, coords },
        setGraphData,
        abortControllerRef
      );
    } else {
      setGraphData({});
    }
  }, [clickMapPoints, layerGraph, spatialNumberPoints]);

  useEffect(() => {
    if (clickMap) {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      setGraphData({});
    }
  }, [clickMap]);

  useEffect(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setGraphData({});
  }, [graphType]);

  const nodeRef = useRef<HTMLDivElement>(null) as any;
  return (
    <Draggable nodeRef={nodeRef} cancel=".clickable">
      <div
        className="absolute top-[5vh] left-full ml-4 z-30 overflow-x-auto overflow-y-auto
        min-w-[15rem] max-w-[40rem] max-h-[90vh] h-max
        bg-[rgba(17,17,17,0.6)] text-white
        p-2 rounded-[16px] shadow-[0px_4px_4px_rgba(0,0,0,1)]"
        ref={nodeRef}
        id="legend-box"
      >
        <div className="flex justify-end pb-1">
          <FontAwesomeIcon
            contentStyleType={'regular'}
            icon={faCircleXmark}
            onClick={handleClose}
            className="clickable"
          />
        </div>
        <div>
          <h1 className="text-sm text-center pb-[0.375rem] font-bold">CHART</h1>
          <h1 className="text-sm text-center pb-[0.375rem] font-bold">{layerGraph.layerName}</h1>
          <div className="flex justify-between items-center w-full gap-1">
            <select
              value={graphType}
              onChange={e => setGraphType(e.target.value)}
              className="clickable bg-black border border-black bg-opacity-20 text-white text-sm rounded-lg  block w-max p-2 hover:bg-opacity-80"
            >
              {['time series', 'spatial'].map(value => (
                <option
                  className="!bg-black !bg-opacity-80 opacity-30 !text-white clickable"
                  value={value}
                  key={value}
                >
                  {value}
                </option>
              ))}
            </select>
            {graphType === 'spatial' && (
              <div className="flex text-xs italic text-center items-center">
                <p>Points:</p>
                <input
                  type="number"
                  min={0}
                  value={spatialNumberPoints}
                  onChange={e => {
                    if (e.target.value === '') {
                      setSpatialNumberPoints(0);
                      return;
                    }
                    const val = parseInt(e.target.value);
                    setSpatialNumberPoints(val);
                  }}
                  className={`clickable bg-black border border-black bg-opacity-20 text-white text-sm rounded-lg w-10 p-2 hover:bg-opacity-80 ${
                    graphType === 'spatial' ? '' : 'hidden'
                  }`}
                  title="Number of points to sample along the drawn line"
                />
              </div>
            )}
            <FontAwesomeIcon
              icon={faMapLocationDot}
              className="cursor-pointer hover:text-yellow-700"
              title="Select point on the map"
              onClick={() => setClickMap(graphType)}
            />
          </div>
          {Object.keys(graphData).length > 0 && graphType === 'time series' && (
            <TimeSeriesGraph graphData={graphData} />
          )}
          {Object.keys(graphData).length > 0 && graphType === 'spatial' && (
            <SpatialGraph graphData={graphData} />
          )}
        </div>
      </div>
    </Draggable>
  );
}
