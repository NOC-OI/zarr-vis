import { useLayersManagementHandle } from '@/application/layers-management';
import { keyable } from '@/entities/models/keyable';
import {
  faCircleInfo,
  faList,
  faMagnifyingGlass,
  faSliders
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState } from 'react';
import {
  getPreviousOpacityValue,
  handleChangeMapLayerAndAddLegend,
  handleChangeOpacity,
  handleClickLayerInfo,
  handleClickLegend,
  handleClickSlider,
  handleClickZoom,
  verifyIfWasSelectedBefore
} from './_actions/actions';

interface DataExplorationTypeOptionsProps {
  content: string;
  subLayer: string;
  subLayers: keyable;
  setInfoButtonBox: (infoButtonBox: string) => void;
}

export function DataExplorationTypeOptions({
  content,
  subLayer,
  subLayers,
  setInfoButtonBox
}: DataExplorationTypeOptionsProps) {
  const {
    setActualLayer,
    setLayerAction,
    selectedLayers,
    setSelectedLayers,
    layerLegend,
    setLayerLegend,
    zarrLayerProps,
    setZarrLayerProps
  } = useLayersManagementHandle();
  const [opacityIsClicked, setOpacityIsClicked] = useState(false);

  return (
    <div className="text-xs">
      <div
        id="type-option"
        className="flex justify-between items-center gap-[0.375rem] font-bold text-white"
      >
        <label
          key={`${content}_${subLayer}`}
          htmlFor={`${content}_${subLayer}`}
          className="opacity-70 hover:opacity-100 flex items-center pr-3 whitespace-nowrap p-2 cursor-pointer"
        >
          <input
            onChange={(e: any) =>
              handleChangeMapLayerAndAddLegend(
                e,
                setActualLayer,
                setOpacityIsClicked,
                setLayerAction,
                setSelectedLayers,
                selectedLayers,
                subLayers,
                subLayer,
                setLayerLegend,
                layerLegend,
                content,
                zarrLayerProps,
                setZarrLayerProps
              )
            }
            value={JSON.stringify({
              subLayer: `${content}_${subLayer}`,
              dataInfo: subLayers[subLayer]
            })}
            className="chk"
            type="checkbox"
            checked={verifyIfWasSelectedBefore(content, subLayer, selectedLayers)}
            id={`${content}_${subLayer}`}
          />
          <label htmlFor={`${content}_${subLayer}`} className="switch">
            <span className="slider"></span>
          </label>
          <p className="align-middle pl-1 text-xs">{subLayer}</p>
        </label>
        {verifyIfWasSelectedBefore(content, subLayer, selectedLayers) ? (
          <div id="layer-edit" className="flex justify-between gap-[0.375rem] font-bold">
            <FontAwesomeIcon
              id="info-subsection-button"
              icon={faCircleInfo}
              title={'Show Layer Info'}
              onClick={() =>
                handleClickLayerInfo(content, subLayer, setInfoButtonBox, selectedLayers)
              }
              className="cursor-pointer hover:text-yellow-700"
            />
            {!subLayer.includes('canvas') && (
              <FontAwesomeIcon
                icon={faList}
                title="Show Legend"
                onClick={() =>
                  handleClickLegend(subLayers, subLayer, setLayerLegend, content, selectedLayers)
                }
                className="cursor-pointer hover:text-yellow-700"
              />
            )}
            {!subLayer.includes('canvas') && (
              <FontAwesomeIcon
                icon={faMagnifyingGlass}
                title="Zoom to the layer"
                onClick={() =>
                  handleClickZoom(
                    content,
                    subLayers,
                    subLayer,
                    setActualLayer,
                    setLayerAction,
                    selectedLayers,
                    setSelectedLayers
                  )
                }
                className="cursor-pointer hover:text-yellow-700"
              />
            )}
            <FontAwesomeIcon
              icon={faSliders}
              title="Change Opacity"
              onClick={() => handleClickSlider(setOpacityIsClicked)}
              className="cursor-pointer hover:text-yellow-700"
            />
          </div>
        ) : null}
      </div>
      {opacityIsClicked && verifyIfWasSelectedBefore(content, subLayer, selectedLayers) && (
        <input
          className="focus:shadow-none outline-none w-full accent-yellow-700"
          type="range"
          step={0.1}
          min={0}
          max={1}
          value={getPreviousOpacityValue(`${content}_${subLayer}`, selectedLayers)}
          onChange={e =>
            handleChangeOpacity(
              e,
              setLayerAction,
              setSelectedLayers,
              content,
              subLayer,
              subLayers,
              setActualLayer
            )
          }
        />
      )}
    </div>
  );
}
