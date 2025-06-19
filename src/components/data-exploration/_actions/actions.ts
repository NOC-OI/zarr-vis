import { keyable } from '@/entities/models/keyable';
import { GetCOGLayer } from '@/lib/map-layers/addGeoraster';
import {
  calculateColorsForLegend,
  colorScale,
  defaultOpacity,
  getLegendCapabilities,
  parseRangeString,
  ZARR_TILE_SERVER_URL
} from '@/lib/map-layers/utils';

export function handleChangeOpacity(
  e: any,
  setLayerAction: (action: string) => void,
  setSelectedLayers: (selectedLayers: keyable) => void,
  content: string,
  subLayer: string,
  subLayers: keyable,
  setActualLayer: (actualLayer: string[]) => void
) {
  function changeMapOpacity(layerInfo: any, opacity: number) {
    setLayerAction('opacity');
    setSelectedLayers((selectedLayers: any) => {
      const copy = { ...selectedLayers };
      const newSelectedLayer = selectedLayers[layerInfo.subLayer];
      newSelectedLayer.opacity = opacity;
      newSelectedLayer.zoom = true;

      delete copy[layerInfo.subLayer];
      const newSelectedLayers: any = {
        [layerInfo.subLayer]: newSelectedLayer,
        ...copy
      };
      const sortedArray = Object.entries(newSelectedLayers).sort(
        (a: any, b: any) => b[1].order - a[1].order
      );
      const sortedObj = Object.fromEntries(sortedArray);
      return sortedObj;
    });
  }

  const layerInfo = JSON.parse(
    JSON.stringify({
      subLayer: `${content}_${subLayer}`,
      dataInfo: subLayers[subLayer]
    })
  );
  setActualLayer([layerInfo.subLayer]);
  changeMapOpacity(layerInfo, e.target.value);
}

export function handleGenerateTimeSeriesGraph(
  setClickPoint: any,
  setActualLayer: any,
  subLayers: any,
  subLayer: any
) {
  setClickPoint((clickPoint: any) => !clickPoint);
  setActualLayer([subLayers[subLayer].url]);
}

export function getPreviousOpacityValue(content: string, selectedLayers: any) {
  return selectedLayers[content].opacity;
}

export async function handleClickLegend(
  subLayers,
  subLayer,
  setLayerLegend,
  content,
  selectedLayers?
) {
  const legendLayerName = `${content}_${subLayer}`;
  if (subLayers[subLayer].dataType === 'WMS') {
    const newParams = subLayers[subLayer].params;
    newParams.request = 'GetLegendGraphic';
    // newParams.layers = newParams.layers
    async function getURILegend(newParams: any) {
      let responseUrl = await getLegendCapabilities(subLayers[subLayer].url, newParams.layers);
      if (!responseUrl) {
        responseUrl = `${subLayers[subLayer].url}?request=${newParams.request}&layer=${newParams.layers}`;
        responseUrl = responseUrl.replace('layers=', 'layer=');
        responseUrl = responseUrl.replace('amp;', '');
        responseUrl = responseUrl + '&SERVICE=wms&format=image/png';
      }
      return responseUrl;
    }
    const responseUrl = await getURILegend(newParams);
    // const colorName = selectedLayers
    //   ? selectedLayers[`${content}_${subLayer}`].colors
    //   : typeof subLayers[subLayer].colors === 'string'
    //     ? subLayers[subLayer].colors
    //     : subLayers[subLayer].colors[0];
    setLayerLegend((layerLegend: any) => {
      const newLayerLegend = { ...layerLegend };
      delete newLayerLegend[legendLayerName];
      newLayerLegend[legendLayerName] = {
        layerName: legendLayerName,
        legend: [[''], ['']],
        dataType: subLayers[subLayer].dataType,
        url: responseUrl,
        selectedLayersKey: legendLayerName
      };
      return newLayerLegend;
    });
  } else if (subLayers[subLayer].dataType === 'COG') {
    let scale: number[] | number = [0, 1];
    if (!selectedLayers) {
      if (typeof subLayers[subLayer].url === 'string') {
        if (!subLayers[subLayer].scale) {
          const getCOGLayer = new GetCOGLayer(subLayers[subLayer], subLayer);
          await getCOGLayer.getStats().then(stats => {
            const minValue = stats.b1.percentile_2.toFixed(4);
            const maxValue = stats.b1.percentile_98.toFixed(4);
            scale = [minValue, maxValue];
          });
        } else {
          scale = subLayers[subLayer].scale;
        }
      } else {
        let minValue;
        let maxValue;
        if (subLayers[subLayer].scale) {
          scale = subLayers[subLayer].scale;
        } else {
          scale = await Promise.all(
            await subLayers[subLayer].url.map(async newUrl => {
              const newSubLayer = { ...subLayers[subLayer] };
              newSubLayer.url = newUrl;
              const getCOGLayer = new GetCOGLayer(newSubLayer, subLayer);
              const stats = await getCOGLayer.getStats();
              if (minValue) {
                if (minValue > stats.b1.percentile_2.toFixed(4)) {
                  minValue = stats.b1.percentile_2.toFixed(4);
                }
              } else {
                minValue = stats.b1.percentile_2.toFixed(4);
              }
              if (maxValue) {
                if (maxValue < stats.b1.percentile_98.toFixed(4)) {
                  maxValue = stats.b1.percentile_98.toFixed(4);
                }
              } else {
                maxValue = stats.b1.percentile_98.toFixed(4);
              }
              return [minValue, maxValue];
            })
          );
          scale = scale[0];
        }
      }
    } else {
      scale = selectedLayers[`${content}_${subLayer}`].scale;
    }
    const colorName = selectedLayers
      ? selectedLayers[`${content}_${subLayer}`].colors
      : subLayers[subLayer].colors
        ? subLayers[subLayer].colors
        : 'ocean_r';
    const { listColors, listColorsValues } = calculateColorsForLegend(colorName, scale, 30);
    setLayerLegend((layerLegend: any) => {
      const newLayerLegend = { ...layerLegend };
      delete newLayerLegend[legendLayerName];
      newLayerLegend[legendLayerName] = {
        layerName: legendLayerName,
        layerInfo: { ...subLayers[subLayer], colors: colorName },
        selectedLayersKey: `${content}_${subLayer}`,
        scale,
        dataDescription: subLayers[subLayer].dataDescription,
        legend: [listColors, listColorsValues],
        dataType: subLayers[subLayer].dataType
      };
      return newLayerLegend;
    });
  } else if (subLayers[subLayer].dataType === 'velocity') {
    const newParams = subLayers[subLayer].params;
    newParams.request = 'GetLegendGraphic';

    async function getURILegend(newParams: any) {
      let responseUrl = await getLegendCapabilities(subLayers[subLayer].url, newParams.layers);
      if (!responseUrl) {
        responseUrl = `${subLayers[subLayer].url}/wms?request=${newParams.request}&layer=${newParams.layers[2]}`;
        responseUrl = responseUrl.replace('layers=', 'layer=');
        responseUrl = responseUrl.replace('amp;', '');
        responseUrl = responseUrl + '&SERVICE=wms&format=image/png';
      }
      setLayerLegend((layerLegend: any) => {
        const newLayerLegend = { ...layerLegend };
        delete newLayerLegend[legendLayerName];
        newLayerLegend[legendLayerName] = {
          layerName: legendLayerName,
          url: responseUrl
        };
        return newLayerLegend;
      });
    }
    await getURILegend(newParams);
  } else if (subLayers[subLayer].dataType === 'ZARR') {
    let scale;
    if (!selectedLayers) {
      if (subLayers[subLayer].scale) {
        scale = subLayers[subLayer].scale;
      } else {
        scale = [0, 1];
      }
    } else {
      scale = selectedLayers[`${content}_${subLayer}`].scale || [0, 1];
    }
    const colorName = selectedLayers
      ? selectedLayers[`${content}_${subLayer}`].colors
      : subLayers[subLayer].colors
        ? subLayers[subLayer].colors
        : 'jet';

    const { listColors, listColorsValues } = calculateColorsForLegend(colorName, scale, 30);
    if (selectedLayers) {
      subLayers[subLayer].dimensions = selectedLayers[`${content}_${subLayer}`].dimensions;
    }
    setLayerLegend((layerLegend: any) => {
      const newLayerLegend = { ...layerLegend };
      delete newLayerLegend[legendLayerName];
      newLayerLegend[legendLayerName] = {
        layerName: legendLayerName,
        layerInfo: { ...subLayers[subLayer], colors: colorName },
        selectedLayersKey: `${content}_${subLayer}`,
        scale,
        dataDescription: subLayers[subLayer].dataDescription,
        legend: [listColors, listColorsValues],
        dataType: subLayers[subLayer].dataType
      };
      return newLayerLegend;
    });
  } else if (['carbonplan', 'zarrgl'].includes(subLayers[subLayer].dataType)) {
    let scale;
    if (!selectedLayers) {
      if (subLayers[subLayer].scale) {
        scale = subLayers[subLayer].scale;
      } else {
        scale = [0, 1];
      }
    } else {
      scale = selectedLayers[`${content}_${subLayer}`].scale || [0, 1];
    }
    const colorName = selectedLayers
      ? selectedLayers[`${content}_${subLayer}`].colors
      : subLayers[subLayer].colors
        ? subLayers[subLayer].colors
        : 'jet';

    const { listColors, listColorsValues } = calculateColorsForLegend(colorName, scale, 30);
    if (selectedLayers) {
      subLayers[subLayer].dimensions = selectedLayers[`${content}_${subLayer}`].dimensions;
    }
    setLayerLegend((layerLegend: any) => {
      const newLayerLegend = { ...layerLegend };
      delete newLayerLegend[legendLayerName];
      newLayerLegend[legendLayerName] = {
        layerName: legendLayerName,
        layerInfo: { ...subLayers[subLayer], colors: colorName },
        selectedLayersKey: `${content}_${subLayer}`,
        scale,
        dataDescription: subLayers[subLayer].dataDescription,
        legend: [listColors, listColorsValues],
        dataType: subLayers[subLayer].dataType
      };
      return newLayerLegend;
    });
  } else if (subLayers[subLayer].dataType === 'velocity-ZARR') {
    if (selectedLayers) {
      subLayers[subLayer].dimensions = selectedLayers[`${content}_${subLayer}`].dimensions;
    }
    setLayerLegend((layerLegend: any) => {
      const newLayerLegend = { ...layerLegend };
      delete newLayerLegend[legendLayerName];
      newLayerLegend[legendLayerName] = {
        layerName: legendLayerName,
        layerInfo: { ...subLayers[subLayer] },
        selectedLayersKey: `${content}_${subLayer}`,
        dataDescription: subLayers[subLayer].dataDescription,
        dataType: subLayers[subLayer].dataType
      };
      return newLayerLegend;
    });
  }
}

export function verifyIfWasSelectedBefore(content: string, subLayer: string, selectedLayers: any) {
  return !!selectedLayers[`${content}_${subLayer}`];
}

export function handleClickLayerInfo(
  content: string,
  subLayer: string,
  setInfoButtonBox: any,
  selectedLayers: any
) {
  setInfoButtonBox({
    title: `${content} - ${subLayer}`,
    content: selectedLayers[`${content}_${subLayer}`].content,
    metadata: selectedLayers[`${content}_${subLayer}`].download?.metadata || ''
  });
}

export function handleClickZoom(
  content,
  subLayers,
  subLayer,
  setActualLayer,
  setLayerAction,
  selectedLayers,
  setSelectedLayers
) {
  const layerInfo = JSON.parse(
    JSON.stringify({
      subLayer: `${content}_${subLayer}`,
      dataInfo: subLayers[subLayer]
    })
  );
  setActualLayer([layerInfo.subLayer]);
  changeMapZoom(layerInfo, setLayerAction, selectedLayers, setSelectedLayers);
}

export function handleClickSlider(setOpacityIsClicked: any) {
  setOpacityIsClicked(opacityIsClicked => !opacityIsClicked);
}

export function handleGenerateGraph(
  setGetPolyline: any,
  setActualLayer: any,
  subLayers: any,
  subLayer: any
) {
  setGetPolyline((getPolyline: any) => !getPolyline);
  setActualLayer([subLayers[subLayer].url]);
}

export function changeMapZoom(
  layerInfo: any,
  setLayerAction: any,
  selectedLayers: any,
  setSelectedLayers: any
) {
  setLayerAction('zoom');
  const newSelectedLayer = selectedLayers[layerInfo.subLayer];
  let order = 0;
  Object.keys(selectedLayers).forEach(key => {
    if (selectedLayers[key].order > order) {
      order = selectedLayers[key].order;
    }
  });
  newSelectedLayer.order = order + 1;
  setSelectedLayers((selectedLayers: any) => {
    const copy = { ...selectedLayers };
    delete copy[layerInfo.subLayer];
    const newSelectedLayers: any = {
      [layerInfo.subLayer]: newSelectedLayer,
      ...copy
    };
    const sortedArray = Object.entries(newSelectedLayers).sort(
      (a: any, b: any) => b[1].order - a[1].order
    );
    const sortedObj = Object.fromEntries(sortedArray);
    return sortedObj;
  });
}

export async function addMapLayer(
  layerInfo: any,
  setLayerAction: any,
  setSelectedLayers: any,
  selectedLayers: any,
  zarrLayerProps?: any,
  setZarrLayerProps?: any
) {
  setLayerAction('add');
  const newSelectedLayer = layerInfo.dataInfo;
  if (newSelectedLayer.dataType === 'COG') {
    if (typeof newSelectedLayer.url === 'string') {
      if (!newSelectedLayer.scale) {
        const getCOGLayer = new GetCOGLayer(newSelectedLayer, '');
        await getCOGLayer.getStats().then(stats => {
          const minValue = stats.b1.percentile_2;
          const maxValue = stats.b1.percentile_98;
          newSelectedLayer.scale = [minValue, maxValue];
        });
      }
    } else {
      const minValue: number[] = [];
      const maxValue: number[] = [];
      newSelectedLayer.url.forEach(async (individualUrl: any) => {
        const individualLayer = { ...newSelectedLayer };
        individualLayer.url = individualUrl;
        const getCOGLayer = new GetCOGLayer(individualLayer, '');
        await getCOGLayer.getStats().then(stats => {
          minValue.push(stats.b1.percentile_2);
          maxValue.push(stats.b1.percentile_98);
        });
        newSelectedLayer.scale = [Math.min(...minValue), Math.max(...maxValue)];
      });
    }
    newSelectedLayer.colors = newSelectedLayer.colors ? newSelectedLayer.colors : 'ocean_r';
  } else if (['ZARR', 'carbonplan', 'zarrgl'].includes(newSelectedLayer.dataType)) {
    newSelectedLayer.scale = newSelectedLayer.scale || [0, 1];
    newSelectedLayer.colors = newSelectedLayer.colors ? newSelectedLayer.colors : 'jet';
  }
  newSelectedLayer.opacity = defaultOpacity;
  newSelectedLayer.zoom = true;
  let order = 0;
  Object.keys(selectedLayers).forEach(key => {
    if (selectedLayers[key].order > order) {
      order = selectedLayers[key].order;
    }
  });
  newSelectedLayer.order = order + 1;
  setSelectedLayers((selectedLayers: any) => {
    const newSelectedLayers: any = {
      [layerInfo.subLayer]: newSelectedLayer,
      ...selectedLayers
    };
    const sortedArray = Object.entries(newSelectedLayers).sort(
      (a: any, b: any) => b[1].order - a[1].order
    );
    const sortedObj = Object.fromEntries(sortedArray);
    return sortedObj;
  });
  if (newSelectedLayer.dataType === 'carbonplan') {
    if (zarrLayerProps) {
      setZarrLayerProps((zarrLayerProps: any) => {
        const copy = { ...zarrLayerProps };
        copy[layerInfo.subLayer] = newSelectedLayer;
        return copy;
      });
    } else {
      setZarrLayerProps({ [layerInfo.subLayer]: newSelectedLayer });
    }
  }
}

export function removeMapLayer(
  layerInfo: any,
  setLayerAction: any,
  setSelectedLayers: any,
  setZarrLayerProps?: any
) {
  setLayerAction('remove');
  setSelectedLayers((selectedLayers: any) => {
    const copy = { ...selectedLayers };
    delete copy[layerInfo.subLayer];
    return copy;
  });
  if (setZarrLayerProps) {
    setZarrLayerProps((zarrLayerProps: any) => {
      const copy = { ...zarrLayerProps };
      delete copy[layerInfo.subLayer];
      return copy;
    });
  }
}

export async function handleChangeMapLayerAndAddLegend(
  e: any,
  setActualLayer: any,
  setOpacityIsClicked: any,
  setLayerAction: any,
  setSelectedLayers: any,
  selectedLayers: any,
  subLayers: any,
  subLayer: any,
  setLayerLegend: any,
  layerLegend: any,
  content: any,
  zarrLayerProps?: any,
  setZarrLayerProps?: any
) {
  const color = subLayers[subLayer].colors
    ? subLayers[subLayer].colors
    : colorScale[Math.floor(Math.random() * 100)];
  const checked = e.target.checked;
  const value = e.target.value;
  const copySubLayers = { ...subLayers };
  if (checked) {
    if (['carbonplan', 'zarrgl'].includes(copySubLayers[subLayer].dataType)) {
      const dimensions = subLayers[subLayer].dimensions;
      Object.keys(dimensions).forEach(key => {
        if (dimensions[key].values.includes('range')) {
          dimensions[key].values = parseRangeString(dimensions[key].values);
        }
      });
      copySubLayers[subLayer].dimensions = dimensions;
    } else if (subLayers[subLayer].dataType.includes('ZARR')) {
      let layerUrl = subLayers[subLayer].url;
      if (subLayers[subLayer].dataType.includes('velocity')) {
        layerUrl += subLayers[subLayer].params.layers[0];
      }
      const url = `${ZARR_TILE_SERVER_URL}time_values?url=${encodeURIComponent(layerUrl)}`;

      const response = await fetch(url);
      const timeValues = await response.json();
      copySubLayers[subLayer].dimensions = {
        time: {
          values: timeValues,
          selected: 0
        }
      };
      if (!copySubLayers[subLayer].colors) {
        copySubLayers[subLayer].colors = 'jet';
      }
      if (copySubLayers[subLayer].params.additional_dims) {
        const additionalDims = copySubLayers[subLayer].params.additional_dims;
        await Promise.all(
          additionalDims.map(async (additionalDimension: any) => {
            const url = `${ZARR_TILE_SERVER_URL}dimension/${additionalDimension}?url=${encodeURIComponent(
              layerUrl
            )}`;
            const response = await fetch(url);
            const dimensionValues = await response.json();
            copySubLayers[subLayer].dimensions[additionalDimension] = {
              values: dimensionValues,
              selected: 0
            };
          })
        );
      }
    }
    handleClickLegend(copySubLayers, subLayer, setLayerLegend, content);
  } else {
    const legendLayerName = `${content}_${subLayer}`;
    if (layerLegend[legendLayerName]) {
      setLayerLegend((layerLegend: any) => {
        const newLayerLegend = { ...layerLegend };
        delete newLayerLegend[legendLayerName];
        return newLayerLegend;
      });
    }
  }
  await handleChangeMapLayer(
    checked,
    value,
    setActualLayer,
    setOpacityIsClicked,
    setLayerAction,
    setSelectedLayers,
    selectedLayers,
    color,
    copySubLayers[subLayer].dimensions,
    zarrLayerProps,
    setZarrLayerProps
  );
}
export async function handleChangeMapLayer(
  checked: any,
  value: any,
  setActualLayer: any,
  setOpacityIsClicked: any,
  setLayerAction: any,
  setSelectedLayers: any,
  selectedLayers: any,
  color?: any,
  dimensionsValues?: any,
  zarrLayerProps?: any,
  setZarrLayerProps?: any
) {
  const layerInfo = JSON.parse(value);
  // if (color) {
  //   layerInfo.dataInfo.colors = color;
  // }
  setActualLayer([layerInfo.subLayer]);
  if (layerInfo.dataInfo.dataType === 'carbonplan') {
    if (checked) {
      if (dimensionsValues) {
        layerInfo.dataInfo.dimensions = dimensionsValues;
      }
      await addMapLayer(
        layerInfo,
        setLayerAction,
        setSelectedLayers,
        selectedLayers,
        zarrLayerProps,
        setZarrLayerProps
      );
    } else {
      setOpacityIsClicked(false);
      removeMapLayer(layerInfo, setLayerAction, setSelectedLayers, setZarrLayerProps);
    }
  } else {
    if (checked) {
      if (dimensionsValues) {
        layerInfo.dataInfo.dimensions = dimensionsValues;
      }
      await addMapLayer(layerInfo, setLayerAction, setSelectedLayers, selectedLayers);
    } else {
      setOpacityIsClicked(false);
      removeMapLayer(layerInfo, setLayerAction, setSelectedLayers);
    }
  }
}
