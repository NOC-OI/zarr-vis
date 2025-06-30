import { useContextHandle } from '@/application/context-handle';
import { useLayersManagementHandle } from '@/application/layers-management';
import { allColorScales } from '@/lib/map-layers/jsColormaps';
import { calculateColorsForLegend } from '@/lib/map-layers/utils';
import { Button } from '../ui/button';
import { TextInput } from '../ui/text-input';

interface EditColorsProps {
  layerLegendName: string;
  colorScale: string | string[];
  setColorScale: React.Dispatch<React.SetStateAction<string>>;
  scaleLimits: number[];
  setScaleLimits: React.Dispatch<React.SetStateAction<number[]>>;
  error: string;
  setError: (error: string) => void;
}

export function EditColors({
  layerLegendName,
  colorScale,
  setColorScale,
  scaleLimits,
  setScaleLimits,
  error,
  setError
}: EditColorsProps) {
  const { layerLegend, setLayerLegend, setSelectedLayers, setActualLayer, setLayerAction } =
    useLayersManagementHandle();

  const { setFlashMessage } = useContextHandle();

  function checkInputValue() {
    let newScaleLimits;
    try {
      newScaleLimits = scaleLimits.map(value => parseFloat(value.toString()));
    } catch (error) {
      console.error('Invalid scale limits:', error);
      return true;
    }

    if (
      isNaN(newScaleLimits[0]) ||
      isNaN(newScaleLimits[1]) ||
      newScaleLimits[0] >= newScaleLimits[1]
    ) {
      return true;
    }
    return false;
  }

  function handleChangeScaleLimits(e: React.ChangeEvent<HTMLInputElement>, idx: number) {
    setScaleLimits(prevScaleLimits => {
      const newScaleLimits = [...prevScaleLimits];
      newScaleLimits[idx] = parseFloat(e.target.value);
      return newScaleLimits;
    });
  }

  const handleSubmit = async () => {
    if (['COG', 'ZARR', 'carbonplan', 'zarrgl'].includes(layerLegend[layerLegendName].dataType)) {
      if (checkInputValue()) {
        setError('Please enter valid values');
        setFlashMessage({
          messageType: 'error',
          content: 'Please enter valid values'
        });
        return;
      }
    }
    setActualLayer([layerLegend[layerLegendName].selectedLayersKey]);
    setLayerAction('update-colors');
    setSelectedLayers(selectedLayers => {
      const newSelectedLayers = { ...selectedLayers };
      newSelectedLayers[layerLegend[layerLegendName].selectedLayersKey] = {
        ...newSelectedLayers[layerLegend[layerLegendName].selectedLayersKey],
        colors: colorScale,
        scale: scaleLimits
      };
      return newSelectedLayers;
    });
    const colors = colorScale;
    const { listColors, listColorsValues } = calculateColorsForLegend(
      colors,
      scaleLimits,
      30,
      typeof colors !== 'string'
    );
    setLayerLegend(layerLegend => {
      const newLayerLegend = { ...layerLegend };
      delete newLayerLegend[layerLegendName];
      newLayerLegend[layerLegendName] = {
        ...layerLegend[layerLegendName],
        scale: scaleLimits,
        layerInfo: {
          ...layerLegend[layerLegendName].layerInfo,
          colors: colorScale,
          scale: scaleLimits
        },
        legend: [listColors, listColorsValues]
      };
      return newLayerLegend;
    });
  };

  return (
    <div className="flex flex-col items-center gap-2" id="edit-layer-colors-options1">
      <div className="pt-4 flex justify-left w-full items-center gap-2">
        <p className="text-md font-bold text-white text-center">Color Scale:</p>
        <div className="flex flex-col items-center gap-2">
          <div className="flex justify-left items-center w-full">
            <select
              id="fileFormat-select"
              value={colorScale}
              onChange={e => setColorScale(e.target.value)}
              className="clickable bg-black border border-black bg-opacity-20 text-white text-sm rounded-lg  block w-max p-2 hover:bg-opacity-80"
            >
              {allColorScales.map((allColorScale, index) => (
                <option
                  className="!bg-black !bg-opacity-80 opacity-30 !text-white clickable"
                  value={allColorScale}
                  key={index}
                >
                  {allColorScale}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      <div className="pt-4 flex justify-left w-full items-center gap-2">
        <p className="text-xs font-bold text-white text-center">Color Limits:</p>
        <div className="flex gap-4 justify-center items-center">
          <TextInput
            id="min-color"
            label="Min Value"
            type="number"
            name="min_value"
            className="clickable opacity-80 hover:opacity-90 focus:opacity-90"
            value={isNaN(scaleLimits[0]) ? '' : String(scaleLimits[0])}
            onInput={(e: React.ChangeEvent<HTMLInputElement>) => handleChangeScaleLimits(e, 0)}
          />
          <TextInput
            id="max-color"
            label="Max Value"
            type="number"
            name="max_value"
            className="clickable opacity-80 hover:opacity-90 focus:opacity-90"
            value={isNaN(scaleLimits[1]) ? '' : String(scaleLimits[1])}
            onInput={(e: React.ChangeEvent<HTMLInputElement>) => handleChangeScaleLimits(e, 1)}
          />
        </div>
      </div>
      <div className="text-red-500 text-sm mt-1">
        {error ? <p>{error}</p> : <div className="pt-[18px]"></div>}
      </div>
      <Button
        onClick={() => handleSubmit()}
        className="w-full text-white bg-black rounded-lg opacity-50 hover:opacity-80 flex justify-center items-center !py-2 gap-2 clickable"
      >
        UPDATE LAYER
      </Button>
    </div>
  );
}
