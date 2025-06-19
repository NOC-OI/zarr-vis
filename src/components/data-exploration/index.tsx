// import { Info } from 'phosphor-react'
import { keyable } from '@/entities/models/keyable';
import { DataExplorationType } from './data-exploration-type';
interface DataExplorationSelectionProps {
  listLayers: keyable;
  setInfoButtonBox: (infoButtonBox: string) => void;
  display: boolean;
}

export function DataExplorationSelection({
  listLayers,
  setInfoButtonBox,
  display
}: DataExplorationSelectionProps) {
  if (!display) {
    return null;
  }
  return (
    <div className="rounded-[16px] p-1.5  fadeIn-50-ease">
      <div className="m-h-[80vh] overflow-y-auto">
        {Object.keys(listLayers).map((layerClass: any) => (
          <DataExplorationType
            key={layerClass}
            content={layerClass}
            childs={listLayers[layerClass].layerNames}
            setInfoButtonBox={setInfoButtonBox}
          />
        ))}
      </div>
    </div>
  );
}
