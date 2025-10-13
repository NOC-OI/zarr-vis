import { useLayersManagementHandle } from '@/application/layers-management';
import { keyable } from '@/entities/models/keyable';
import { faMap } from '@fortawesome/free-solid-svg-icons';
import { useEffect, useState } from 'react';
import { DataExplorationSelection } from '../data-exploration';
import { InfoButtonBox } from '../info-button-box';
import { LayerLegendBox } from '../layer-legend-box';
import { SideBarLink } from './side-bar-link';
import { LayerGraphBox } from '../layer-graph-box';
import { useGraphManagementHandle } from '@/application/graph-management';

interface SideBarProps {
  listLayers: keyable;
}

export function SideBar({ listLayers }: SideBarProps) {
  const [sideBarOption, setSideBarOption] = useState('');
  const [infoButtonBox, setInfoButtonBox] = useState({});

  const {
    selectedLayers,
    setSelectedLayers,
    setActualLayer,
    setLayerAction,
    layerLegend,
    setLayerLegend
  } = useLayersManagementHandle();
  const { layerGraph } = useGraphManagementHandle();

  useEffect(() => {
    Object.keys(layerLegend).forEach((legend: string) => {
      if (!Object.keys(selectedLayers).includes(legend)) {
        setLayerLegend(layerLegend => {
          const newLayerLegend = { ...layerLegend };
          delete newLayerLegend[legend];
          return newLayerLegend;
        });
      }
    });
  }, [layerLegend, selectedLayers, setLayerLegend]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function handleEraseLayers(_e: any) {
    setActualLayer(Object.keys(selectedLayers));
    setSelectedLayers({});
    setLayerLegend({});
    setLayerAction('remove');
  }

  async function handleShowSelection(e: any) {
    const oldSelectedSidebarOption = sideBarOption;
    if (oldSelectedSidebarOption === e.currentTarget.id) {
      setSideBarOption('');
    } else {
      setSideBarOption(e.currentTarget.id);
    }
  }

  return (
    <div className="flex absolute left-2 top-[2vh]">
      <div className="relative max-h-[80vh] bg-gray-900 rounded-[16px] text-base p-1.5 z-20 shadow-[0px_4px_4px_rgba(0,0,0,1)]">
        <div className="flex gap-3 md:gap-6 pl-2 pr-2">
          <SideBarLink
            title={'Data Exploration'}
            id={'data_exploration'}
            onClick={handleShowSelection}
            active={sideBarOption === 'data_exploration'}
            icon={faMap}
          />
        </div>
        <div>
          <DataExplorationSelection
            listLayers={listLayers}
            setInfoButtonBox={setInfoButtonBox}
            display={sideBarOption === 'data_exploration'}
          />
        </div>
      </div>
      {Object.keys(layerLegend).map(legend => (
        <LayerLegendBox key={legend} layerLegendName={legend} />
      ))}
      {Object.keys(layerGraph).length !== 0 && <LayerGraphBox />}
      {Object.keys(infoButtonBox).length !== 0 ? (
        <InfoButtonBox infoButtonBox={infoButtonBox} setInfoButtonBox={setInfoButtonBox} />
      ) : null}
    </div>
  );
}
