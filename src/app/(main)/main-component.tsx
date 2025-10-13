'use client';
import { ContextHandleProvider } from '@/application/context-handle';
import { GraphManagementHandleProvider } from '@/application/graph-management';
import { LayersManagementHandleProvider } from '@/application/layers-management';
import { MapHomeMapbox } from '@/components/map-home-mapbox';
import { SideBar } from '@/components/side-bar';
import { keyable } from '@/entities/models/keyable';

export function MainComponent(listLayers: keyable) {
  return (
    <ContextHandleProvider>
      <LayersManagementHandleProvider>
        <GraphManagementHandleProvider>
          <SideBar listLayers={listLayers['listLayers']} />
          <MapHomeMapbox />
        </GraphManagementHandleProvider>
      </LayersManagementHandleProvider>
    </ContextHandleProvider>
  );
}
