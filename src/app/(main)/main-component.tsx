'use client';
import { ContextHandleProvider } from '@/application/context-handle';
import { LayersManagementHandleProvider } from '@/application/layers-management';
import { MapHomeMapbox } from '@/components/map-home-mapbox';
import { SideBar } from '@/components/side-bar';
import { keyable } from '@/entities/models/keyable';

export function MainComponent(listLayers: keyable) {
  return (
    <ContextHandleProvider>
      <LayersManagementHandleProvider>
        <SideBar listLayers={listLayers['listLayers']} />
        <MapHomeMapbox />
      </LayersManagementHandleProvider>
    </ContextHandleProvider>
  );
}
