import { keyable } from '@/entities/models/keyable';
import React, { useEffect, useRef } from 'react';
import uPlot from 'uplot';
import 'uplot/dist/uPlot.min.css';

type SpatialGraphProps = {
  graphData: keyable;
  width?: number;
  height?: number;
};

export function SpatialGraph({ graphData, width = 500, height = 300 }: SpatialGraphProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const uplotRef = useRef<uPlot | null>(null);
  const yLabel = (
    graphData.dataDescription
      ? `${graphData.dataDescription[0]} (${graphData.dataDescription[1]})`
      : 'Value'
  ).replace(' ()', '');

  useEffect(() => {
    if (!chartRef.current) return;

    const opts: uPlot.Options = {
      title: 'Spatial Graph',
      width,
      height,
      scales: {
        x: { time: false },
        y: { auto: true }
      },
      series: [
        {
          label: 'Distance (km)',
          width: 2
        },
        {
          label: yLabel,
          stroke: 'cyan',
          width: 2
        }
      ],
      axes: [
        { stroke: '#aaa', label: 'Distance (km)' },
        { stroke: '#aaa', label: yLabel }
      ],
      legend: {
        show: true
      }
    };

    const initialData: uPlot.AlignedData = [[], []];
    const u = new uPlot(opts, initialData, chartRef.current);
    uplotRef.current = u;

    return () => {
      u.destroy();
      uplotRef.current = null;
    };
  }, [width, height, yLabel]);

  useEffect(() => {
    const u = uplotRef.current;
    if (!u) return;

    if (!graphData?.x?.length || !graphData?.y?.length) {
      u.setData([[], []]);
      return;
    }
    const xValues = graphData.x;

    const yValues = graphData.y;
    u.setData([xValues, yValues]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graphData.x.length]);

  return (
    <div className="relative w-full flex flex-col items-center">
      <div ref={chartRef} className="clickable" />
      {graphData.coords && graphData.coords.length === 2 && (
        <>
          <div>
            START POSITION - LAT: {graphData.coords[0].lat.toFixed(3)}, LNG:{' '}
            {graphData.coords[0].lng.toFixed(3)}
          </div>
          <div>
            END POSITION - LAT: {graphData.coords[1].lat.toFixed(3)}, LNG:{' '}
            {graphData.coords[1].lng.toFixed(3)}
          </div>
        </>
      )}
      {graphData.isLoading && <p className="text-xs text-gray-300 mt-2 italic">Loading data...</p>}
      {graphData.error && <p className="text-xs text-red-400 mt-2">Error: {graphData.error}</p>}
    </div>
  );
}
