'use client';
import { keyable } from '@/entities/models/keyable';
import { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';

interface LayersManagementHandleContextType {
  selectedLayers: keyable;
  setSelectedLayers: (selectedLayers: keyable) => void;
  zarrLayerProps: keyable;
  setZarrLayerProps: (zarrLayerProps: keyable) => void;
  actualLayer: string[];
  setActualLayer: (actualLayer: string[]) => void;
  layerAction: string;
  setLayerAction: (layerAction: string) => void;
  layerLegend: keyable;
  setLayerLegend: (layerLegend: keyable) => void;
  showWindLayer: keyable;
  setShowWindLayer: (showWindLayer: keyable) => void;
  windyLayerRef: React.RefObject<any>;
}
const LayersManagementHandleContext = createContext<LayersManagementHandleContextType | undefined>(
  undefined
);

interface LayersManagementHandleProviderProps {
  children: ReactNode;
}

export const LayersManagementHandleProvider: React.FC<LayersManagementHandleProviderProps> = ({
  children
}) => {
  const [selectedLayers, setSelectedLayers] = useState<keyable>({});
  const [zarrLayerProps, setZarrLayerProps] = useState<keyable>({});
  const windyLayerRef = useRef<any>(null);

  const [actualLayer, setActualLayer] = useState<string[]>(['']);

  const [layerAction, setLayerAction] = useState('');

  const [layerLegend, setLayerLegend] = useState({});
  const [showWindLayer, setShowWindLayer] = useState({});
  useEffect(() => {
    if (Object.keys(selectedLayers).length > 0 && actualLayer[0]) {
      if (['zoom', 'opacity', 'update-colors', 'update-dimensions'].includes(layerAction)) {
        if (selectedLayers[actualLayer[0]].dataType === 'carbonplan') {
          const newSelectedLayer = selectedLayers[actualLayer[0]];
          setZarrLayerProps((selectedLayers: any) => {
            const copy = { ...selectedLayers };
            delete copy[actualLayer[0]];
            const newSelectedLayers: any = {
              [actualLayer[0]]: newSelectedLayer,
              ...copy
            };
            return newSelectedLayers;
          });
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLayers]);

  return (
    <LayersManagementHandleContext.Provider
      value={{
        selectedLayers,
        setSelectedLayers,
        zarrLayerProps,
        setZarrLayerProps,
        actualLayer,
        setActualLayer,
        layerAction,
        setLayerAction,
        layerLegend,
        setLayerLegend,
        showWindLayer,
        setShowWindLayer,
        windyLayerRef
      }}
    >
      {children}
    </LayersManagementHandleContext.Provider>
  );
};

export const useLayersManagementHandle = (): LayersManagementHandleContextType => {
  const context = useContext(LayersManagementHandleContext);
  if (!context) {
    throw new Error(
      'useLayersManagementHandle must be used within a LayersManagementHandleProvider'
    );
  }
  return context;
};
