import { useLayersManagementHandle } from '@/application/layers-management';
import { keyable } from '@/entities/models/keyable';
import { faCircleXmark, faPenToSquare } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useRef, useState } from 'react';
import Draggable from 'react-draggable';
import { Button } from '../ui/button';
import { ColorBar } from './colorbar';
import { EditColors } from './edit-colors';

interface LayerLegendBoxProps {
  layerLegendName: string;
}

export function LayerLegendBox({ layerLegendName }: LayerLegendBoxProps) {
  const {
    layerLegend,
    setLayerLegend,
    selectedLayers,
    setSelectedLayers,
    setActualLayer,
    setLayerAction,
    setZarrLayerProps
  } = useLayersManagementHandle();
  function handleClose() {
    setLayerLegend(layerLegend => {
      const newLayerLegend = { ...layerLegend };
      delete newLayerLegend[layerLegendName];
      return newLayerLegend;
    });
  }

  const [colorScale, setColorScale] = useState<string>(
    layerLegend[layerLegendName].layerInfo?.colors
  );

  const [scaleLimits, setScaleLimits] = useState<any[]>(layerLegend[layerLegendName].scale);
  const [editLayerColors, setEditLayerColors] = useState<boolean>(false);

  const [wmsError, setWmsError] = useState(false);

  const [error, setError] = useState('');
  const errorTimeoutRef = useRef<number | null>(null);
  useEffect(() => {
    if (errorTimeoutRef.current !== null) {
      clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = null;
    }
    if (error) {
      errorTimeoutRef.current = window.setTimeout(() => {
        setError('');
      }, 5000);
    }
    return () => {
      if (errorTimeoutRef.current !== null) {
        clearTimeout(errorTimeoutRef.current);
      }
    };
  }, [error]);
  useEffect(() => {
    setColorScale(layerLegend[layerLegendName].layerInfo?.colors);
    setScaleLimits(layerLegend[layerLegendName].scale);
  }, [layerLegend, layerLegendName]);

  const handleChangeWMSStyle = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    setActualLayer([layerLegend[layerLegendName].selectedLayersKey]);
    setLayerAction('update-colors');
    setSelectedLayers((selectedLayers: keyable) => {
      const newSelectedLayers = { ...selectedLayers };
      newSelectedLayers[layerLegend[layerLegendName].selectedLayersKey] = {
        ...newSelectedLayers[layerLegend[layerLegendName].selectedLayersKey],
        colors: e.target.value
      };
      return newSelectedLayers;
    });
    setLayerLegend((layerLegend: any) => {
      const newLayerLegend = { ...layerLegend };
      const copyUpdatedLayerLegend = { ...layerLegend[layerLegendName] };
      delete newLayerLegend[layerLegendName];
      newLayerLegend[layerLegendName] = {
        ...copyUpdatedLayerLegend,
        layerInfo: {
          ...copyUpdatedLayerLegend.layerInfo,
          colors: e.target.value
        }
      };
      return newLayerLegend;
    });
  };

  const handleChangeDimension = async (e, dimension) => {
    setActualLayer([layerLegend[layerLegendName].selectedLayersKey]);
    setLayerAction('update-dimensions');
    setSelectedLayers(selectedLayers => {
      const newSelectedLayers = { ...selectedLayers };
      newSelectedLayers[layerLegend[layerLegendName].selectedLayersKey] = {
        ...newSelectedLayers[layerLegend[layerLegendName].selectedLayersKey]
      };
      newSelectedLayers[layerLegend[layerLegendName].selectedLayersKey].dimensions[
        dimension
      ].selected = layerLegend[layerLegendName].layerInfo.dimensions[dimension].values.indexOf(
        e.target.value
      );
      return newSelectedLayers;
    });
    setLayerLegend(layerLegend => {
      const newLayerLegend = { ...layerLegend };
      delete newLayerLegend[layerLegendName];
      newLayerLegend[layerLegendName] = {
        ...layerLegend[layerLegendName],
        layerInfo: {
          ...layerLegend[layerLegendName].layerInfo
        }
      };

      let indexValue = layerLegend[layerLegendName].layerInfo.dimensions[dimension].values.indexOf(
        e.target.value
      );
      if (indexValue === -1) {
        indexValue = layerLegend[layerLegendName].layerInfo.dimensions[dimension].values.indexOf(
          parseInt(e.target.value)
        );
      }

      newLayerLegend[layerLegendName].layerInfo.dimensions[dimension].selected = indexValue;
      return newLayerLegend;
    });
    if (selectedLayers[layerLegend[layerLegendName].selectedLayersKey].dataType === 'carbonplan') {
      setZarrLayerProps(selectedLayers => {
        const newSelectedLayers = { ...selectedLayers };
        newSelectedLayers[layerLegend[layerLegendName].selectedLayersKey] = {
          ...newSelectedLayers[layerLegend[layerLegendName].selectedLayersKey]
        };
        newSelectedLayers[layerLegend[layerLegendName].selectedLayersKey].dimensions[
          dimension
        ].selected = layerLegend[layerLegendName].layerInfo.dimensions[dimension].values.indexOf(
          e.target.value
        );

        return newSelectedLayers;
      });
    }
  };
  useEffect(() => {
    if (layerLegend[layerLegendName].url) {
      setEditLayerColors(false);
    }
  }, [layerLegend, layerLegendName]);
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
          <h1 className="text-sm text-center pb-[0.375rem] font-bold">LEGEND</h1>
          <h1 className="text-sm text-center pb-[0.375rem] font-bold">
            {layerLegend[layerLegendName].layerName}
          </h1>
          <div>
            {layerLegend[layerLegendName].url &&
              (wmsError ? (
                <p className="text-xs text-center font-bold">
                  <strong>Legend not available</strong>
                </p>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={
                    layerLegend[layerLegendName].url[
                      layerLegend[layerLegendName].layerInfo.styles.indexOf(
                        layerLegend[layerLegendName].layerInfo.colors
                      )
                    ]
                  }
                  onError={() => setWmsError(true)}
                  alt="Layer Legend"
                />
              ))}
            {['COG', 'ZARR', 'carbonplan', 'zarrgl'].includes(
              layerLegend[layerLegendName].dataType
            ) ? (
              <div className="flex flex-col justify-center items-center gap-2">
                <ColorBar layerLegend={layerLegend[layerLegendName]} />
              </div>
            ) : (
              layerLegend[layerLegendName].legend &&
              layerLegend[layerLegendName].legend[0].map((color: any, idx: any) => {
                return (
                  <div key={color} className="flex p-1">
                    <div style={{ backgroundColor: color }} className="rounded w-4"></div>
                    <p className="text-xs text-center font-bold">
                      {layerLegend[layerLegendName].legend[1][idx]}
                    </p>
                  </div>
                );
              })
            )}
            {layerLegend[layerLegendName].layerInfo?.dimensions &&
              Object.keys(layerLegend[layerLegendName].layerInfo.dimensions).map(dimension => (
                <div className="p-4 flex justify-between w-[90%] items-center" key={dimension}>
                  <p className="text-md font-bold text-white text-center">
                    {dimension.charAt(0).toUpperCase() + dimension.slice(1)}:
                  </p>
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex justify-left items-center w-full">
                      <select
                        value={
                          layerLegend[layerLegendName].layerInfo.dimensions[dimension].values[
                            layerLegend[layerLegendName].layerInfo.dimensions[dimension].selected
                          ]
                        }
                        onChange={e => handleChangeDimension(e, dimension)}
                        className="clickable bg-black border border-black bg-opacity-20 text-white text-sm rounded-lg  block w-max p-2 hover:bg-opacity-80"
                      >
                        {layerLegend[layerLegendName].layerInfo.dimensions[dimension].values.map(
                          (value, index) => (
                            <option
                              className="!bg-black !bg-opacity-80 opacity-30 !text-white clickable"
                              value={value}
                              key={index}
                            >
                              {dimension === 'time' && value.length > 10
                                ? value.slice(0, 13)
                                : String(value).replace(/(\.\d+)?$/, '')}
                            </option>
                          )
                        )}
                      </select>
                    </div>
                  </div>
                </div>
              ))}

            {['WMS'].includes(layerLegend[layerLegendName].dataType) && (
              <div className="p-4 flex justify-between w-[90%] items-center">
                <p className="text-md font-bold text-white text-center">Style</p>
                <div className="flex flex-col items-center gap-2">
                  <div className="flex justify-left items-center w-full">
                    <select
                      value={layerLegend[layerLegendName].layerInfo.colors}
                      onChange={e => handleChangeWMSStyle(e)}
                      className="clickable bg-black border border-black bg-opacity-20 text-white text-sm rounded-lg  block w-max p-2 hover:bg-opacity-80"
                    >
                      {layerLegend[layerLegendName].layerInfo.styles.map((value, index) => (
                        <option
                          className="!bg-black !bg-opacity-80 opacity-30 !text-white clickable"
                          value={value}
                          key={index}
                        >
                          {value}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
            {['ZARR', 'COG', 'carbonplan', 'zarrgl'].includes(
              layerLegend[layerLegendName].dataType
            ) && (
              <div className="flex flex-col justify-center items-center gap-2">
                <Button
                  id="edit-layer-colors-button"
                  onClick={() => setEditLayerColors(!editLayerColors)}
                  variant="contained"
                  className="w-full text-white bg-black rounded-lg opacity-50 hover:opacity-80 flex justify-center items-center !py-0 gap-2 clickable"
                >
                  <FontAwesomeIcon icon={faPenToSquare} />
                  <p>EDIT COLORS</p>
                </Button>
              </div>
            )}
          </div>
        </div>
        {editLayerColors && (
          <EditColors
            layerLegendName={layerLegendName}
            colorScale={colorScale}
            setColorScale={setColorScale}
            scaleLimits={scaleLimits}
            setScaleLimits={setScaleLimits}
            error={error}
            setError={setError}
          />
        )}
      </div>
    </Draggable>
  );
}
