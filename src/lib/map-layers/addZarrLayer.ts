import { keyable } from '@/entities/models/keyable';
import { defaultMaxZoom, defaultOpacity, ZARR_TILE_SERVER_URL } from './utils';

export class GetZarrLayer {
  layerName: keyable;
  actualLayer: string;
  layer: keyable | null;
  url: any;
  constructor(layerName: keyable, actualLayer: string) {
    this.layerName = layerName;
    this.actualLayer = actualLayer;
    this.layer = null;
    this.url = layerName.url;
  }

  async getTile() {
    const params: keyable = {
      url: this.layerName.url,
      variable:
        this.layerName.params.variable || `${this.layerName.url.split('/').pop().split('.')[0]}`,
      reference: false,
      decode_times: true,
      return_mask: true
    };
    if (this.layerName.colors) {
      params.colormap_name = this.layerName.colors;
      params.rescale = this.layerName.scale
        ? `${this.layerName.scale[0]},${this.layerName.scale[1]}`
        : '0,1';
    }
    if (this.layerName.scale) {
      params.rescale = this.layerName.scale
        ? `${this.layerName.scale[0]},${this.layerName.scale[1]}`
        : '0,1';
    }
    let dropDims = '';
    Object.keys(this.layerName.dimensions).forEach(dimension => {
      if (dimension === 'time') {
        params.date_time =
          this.layerName.dimensions.time.values[this.layerName.dimensions.time.selected].split(
            'T'
          )[0];
      } else {
        const dimensionValue =
          this.layerName.dimensions[dimension].values[
            this.layerName.dimensions[dimension].selected
          ];
        dropDims += `${dimension}=${dimensionValue},`;
      }
    });
    if (dropDims) {
      dropDims = dropDims.slice(0, -1);
      params.drop_dim = dropDims;
    }

    const encodedParams = {};
    for (const key in params) {
      encodedParams[key] = encodeURIComponent(params[key]);
    }
    const queryString = Object.keys(encodedParams)
      .map(key => `${encodeURIComponent(key)}=${encodedParams[key]}`)
      .join('&');

    const tileServerEnpoint = 'tiles/WebMercatorQuad/{z}/{x}/{y}@1x';
    const newUrl = `${ZARR_TILE_SERVER_URL}${tileServerEnpoint}?${queryString}`;
    return {
      id: this.actualLayer,
      type: 'raster',
      source: {
        type: 'raster',
        tiles: [newUrl],
        tileSize: 256,
        maxzoom: defaultMaxZoom,
        attribution: this.actualLayer
      },
      layout: {
        visibility: 'visible'
      },
      paint: {
        'raster-opacity': defaultOpacity
      },
      metadata: {
        url: this.url
      }
    };
  }
}
