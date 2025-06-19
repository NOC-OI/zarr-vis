import { keyable } from '@/entities/models/keyable';
import axios from 'axios';
import { parse, stringify } from 'qs';
import { defaultOpacity, getUrlTileServer, TILE_SERVER_URL } from './utils';

export class GetCOGLayer {
  layerName: keyable;
  actualLayer: string;
  url: any;
  dataType: string;
  layer: keyable;
  colourScheme: string;
  bounds: null;
  popupText: string;
  position: null;
  error: string;
  stats: keyable;
  contrast: boolean;
  constructor(
    layerName: keyable,
    actualLayer: string,
    dataType = 'COG',
    colourScheme = 'ocean_r',
    contrast = true
  ) {
    this.layerName = layerName;
    this.actualLayer = actualLayer;
    this.url = layerName.url;
    this.dataType = dataType;
    this.layer = {};
    this.colourScheme = colourScheme;
    this.bounds = null;
    this.popupText = '';
    this.position = null;
    this.error = '';
    this.stats = {};
    this.contrast = contrast;
  }

  async getStats() {
    const [newUrl, isUrlEncoded] = getUrlTileServer(this.layerName, this.url);

    return await axios
      .get(
        `${TILE_SERVER_URL}cog/statistics?url=${encodeURIComponent(newUrl)}&encoded=${isUrlEncoded}`
      )
      .then(r => r.data)
      .catch(error => {
        return { error: error.response.status };
      });
  }

  async getInfo() {
    const [newUrl, isUrlEncoded] = getUrlTileServer(this.layerName, this.url);

    return await axios
      .get(`${TILE_SERVER_URL}cog/info?url=${encodeURIComponent(newUrl)}&encoded=${isUrlEncoded}`)
      .then(r => r.data)
      .catch(error => {
        return { error: error.response.status };
      });
  }

  createMapboxLayer(tileUrl, actualLayer, bounds) {
    return {
      id: actualLayer,
      source: {
        type: 'raster',
        tiles: [tileUrl],
        tileSize: 256,
        attribution: actualLayer,
        bounds: bounds || undefined
      },
      layout: {
        visibility: 'visible'
      },
      paint: {
        'raster-opacity': defaultOpacity
      }
    };
  }

  async getTile() {
    const [newUrl, isUrlEncoded] = getUrlTileServer(this.layerName, this.url);

    if (this.layerName.colors) {
      this.colourScheme = this.layerName.colors.toLowerCase();
    }
    const cogInfo: keyable = await this.getInfo();

    if (cogInfo?.error === 500) {
      this.error = 'You do not have authorization to access this file';
      return {};
    }

    this.bounds = cogInfo.bounds;
    this.stats = await this.getStats();
    if (this.stats?.error === 500) {
      this.error = 'You do not have authorization to access this file';
      return {};
    }

    const bands: string[] = [];
    for (let i = 0; i < cogInfo.band_descriptions.length; i++) {
      bands.push(cogInfo.band_descriptions[i][0]);
    }
    let bidx = [1];
    if (bands.length >= 3) {
      bidx = [1, 2, 3];
    }
    const rescale: string[] = [];
    for (let i = 0; i < bands.length; i++) {
      const stats = this.stats[bands[i]];
      if (this.layerName.scale) {
        rescale.push(`${this.layerName.scale[0]},${this.layerName.scale[1]}`);
      } else {
        if (this.contrast && stats) {
          rescale.push(`${stats.percentile_2},${stats.percentile_98}`);
        } else {
          rescale.push('0,255');
        }
      }
    }

    const args = {
      bidx: bidx.length === 1 ? bidx[0] : bidx,
      rescale: rescale.length === 1 ? rescale[0] : rescale,
      url: newUrl,
      encoded: isUrlEncoded
    };

    const tileJson = await axios
      .get(`${TILE_SERVER_URL}cog/WebMercatorQuad/tilejson.json`, {
        params: args,
        paramsSerializer: {
          encode: params => parse(params),
          serialize: params => stringify(params, { arrayFormat: 'repeat' })
        }
      })
      .then(r => r.data);
    let tileUrl = tileJson.tiles[0];
    if (bands.length === 1) {
      tileUrl += `&colormap_name=${this.colourScheme}`;
    }
    this.layer = this.createMapboxLayer(tileUrl, this.actualLayer, this.bounds);
    return this.layer;
  }
}
