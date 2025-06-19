import { layersJson } from '@/application/data/layers-json';
import { keyable } from '@/entities/models/keyable';
import React from 'react';
import { MainComponent } from './main-component';

export default async function Page() {
  const listLayers: keyable = layersJson;

  return (
    <React.Fragment>
      <MainComponent listLayers={listLayers} />
    </React.Fragment>
  );
}
