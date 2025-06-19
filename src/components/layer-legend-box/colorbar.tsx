interface ColorBarProps {
  layerLegend: any;
}

export function ColorBar({ layerLegend }: ColorBarProps) {
  const dataDescription = layerLegend.dataDescription ? layerLegend.dataDescription : ['', ''];
  return (
    <div className="p-2 z-40 block">
      <div className="flex justify-center font-extrabold gap-3">
        <p className="text-xs text-center font-bold">{dataDescription[0]}</p>
        <p className="text-xs text-center font-bold">{dataDescription[1]}</p>
      </div>
      <div className="flex justify-between font-extrabold">
        <p className="text-xs text-center font-bold">
          {Math.min(...layerLegend.legend[1]).toFixed(1)}
        </p>
        <p className="text-xs text-center font-bold">
          {Math.max(...layerLegend.legend[1]).toFixed(1)}
        </p>
      </div>
      <div className="flex">
        {layerLegend.legend[0].map((value: string, idx) => (
          <div
            className="px-[0.1rem] py-[0.375rem]"
            key={idx}
            style={{
              backgroundColor: `rgb(${value[0]},${value[1]},${value[2]})`
            }}
          >
            <p className="opacity-0">=</p>
          </div>
        ))}
      </div>
    </div>
  );
}
