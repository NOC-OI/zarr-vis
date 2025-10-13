'use client';
import { keyable } from '@/entities/models/keyable';
import { createContext, ReactNode, useContext, useState } from 'react';

interface GraphManagementHandleContextType {
  layerGraph: keyable;
  setLayerGraph: (layerGraph: keyable) => void;
  clickMap: string;
  setClickMap: (clickMap: string) => void;
  clickMapPoints: keyable;
  setClickMapPoints: (clickMapPoints: keyable) => void;
}
const GraphManagementHandleContext = createContext<GraphManagementHandleContextType | undefined>(
  undefined
);

interface GraphManagementHandleProviderProps {
  children: ReactNode;
}

export const GraphManagementHandleProvider: React.FC<GraphManagementHandleProviderProps> = ({
  children
}) => {
  const [layerGraph, setLayerGraph] = useState({});
  const [clickMap, setClickMap] = useState('');
  const [clickMapPoints, setClickMapPoints] = useState<keyable>({});
  return (
    <GraphManagementHandleContext.Provider
      value={{
        layerGraph,
        setLayerGraph,
        clickMap,
        setClickMap,
        clickMapPoints,
        setClickMapPoints
      }}
    >
      {children}
    </GraphManagementHandleContext.Provider>
  );
};

export const useGraphManagementHandle = (): GraphManagementHandleContextType => {
  const context = useContext(GraphManagementHandleContext);
  if (!context) {
    throw new Error('useGraphManagementHandle must be used within a GraphManagementHandleProvider');
  }
  return context;
};
