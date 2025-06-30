import { keyable } from '@/entities/models/keyable';
import { fromArrayBuffer } from 'geotiff';
import { defaultOpacity, getWCSUrl, getZarrWCSUrl } from './utils';

export class AddCanvasLayer {
  layerName: keyable;
  url: string;
  layer: keyable;
  width: number;
  height: number;
  windy: any;
  canvas: HTMLCanvasElement | null;
  constructor() {
    this.layerName = {};
    this.url = '';
    this.layer = {};
    this.width = 256;
    this.height = 256;
    this.windy = null;
    this.canvas = null;
  }

  async parseGeoraster(arrayBuffer: ArrayBuffer) {
    const tiff = await fromArrayBuffer(arrayBuffer);
    const image = await tiff.getImage();
    const values = await image.readRasters();
    const width = image.getWidth();
    const height = image.getHeight();
    const bbox = image.getBoundingBox();
    const resolutionX = (bbox[2] - bbox[0]) / width;
    const resolutionY = (bbox[3] - bbox[1]) / height;
    return {
      values,
      width,
      height,
      bbox,
      resolution: { resolutionX, resolutionY }
    };
  }

  async parseData(data: keyable) {
    const values = data.data;
    const bbox = data.bounds;
    const width = data.width;
    const height = data.height;
    const resolutionX = Math.abs((bbox[2] - bbox[0]) / width);
    const resolutionY = Math.abs((bbox[3] - bbox[1]) / height);
    return {
      values,
      width,
      height,
      bbox,
      resolution: { resolutionX, resolutionY }
    };
  }

  async loadData(url: string, dataType: string) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    const georaster = await this.parseData(data);
    const velocityData = {
      data: georaster.values,
      header: {
        parameterUnit: 'm.s-1',
        parameterNumber: dataType === 'U' ? 2 : 3,
        dx: georaster.resolution.resolutionX,
        dy: georaster.resolution.resolutionY,
        parameterNumberName: dataType === 'U' ? 'Eastward currents' : 'Northward currents',
        la1: georaster.bbox[3],
        la2: georaster.bbox[1],
        parameterCategory: 2,
        lo1: georaster.bbox[0],
        lo2: georaster.bbox[2],
        nx: georaster.width,
        ny: georaster.height
      }
    };
    return velocityData;
  }

  async loadGeoraster(url: string, dataType: string) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      const georaster = await this.parseGeoraster(arrayBuffer);
      const velocityData = {
        data: Object.values(georaster.values[0]).map(value => {
          if (value === parseFloat('-32768')) {
            return null;
          }
          return value;
        }),
        header: {
          parameterUnit: 'm.s-1',
          parameterNumber: dataType === 'U' ? 2 : 3,
          dx: georaster.resolution.resolutionX,
          dy: georaster.resolution.resolutionY,
          parameterNumberName: dataType === 'U' ? 'Eastward currents' : 'Northward currents',
          la1: georaster.bbox[3],
          la2: georaster.bbox[1],
          parameterCategory: 2,
          lo1: georaster.bbox[0],
          lo2: georaster.bbox[2],
          nx: georaster.width,
          ny: georaster.height
        }
      };
      return velocityData;
    } catch (error) {
      console.error('Error loading GeoTIFF:', error);
    }
  }

  remove(map: any) {
    if (this.canvas) {
      map.current.getContainer().removeChild(this.canvas);
      this.canvas = null;
    }
    if (this.windy) {
      this.windy.stop();
      this.windy = null;
    }
    map.current.off('resize');
    map.current.off('move');
    map.current.off('zoom');
    map.current.off('moveend');
  }

  async create(layerName: keyable, map: any) {
    this.layerName = layerName;
    this.url = layerName.url;
    let velocityDataU;
    let velocityDataV;
    if (this.layerName.dataType.includes('ZARR')) {
      const wcsUrlU = await getZarrWCSUrl(this.url, this.layerName, 0);
      const wcsUrlV = await getZarrWCSUrl(this.url, this.layerName, 1);

      velocityDataU = await this.loadData(wcsUrlU, 'U');
      velocityDataV = await this.loadData(wcsUrlV, 'V');
    } else {
      const wcsUrlU = await getWCSUrl(
        this.url,
        this.width,
        this.height,
        this.layerName.params.layers[0],
        this.layerName.dimensions
      );
      const wcsUrlV = await getWCSUrl(
        this.url,
        this.width,
        this.height,
        this.layerName.params.layers[1],
        this.layerName.dimensions
      );
      velocityDataU = await this.loadGeoraster(wcsUrlU, 'U');
      velocityDataV = await this.loadGeoraster(wcsUrlV, 'V');
    }
    const opacity = this.layerName.opacity ?? defaultOpacity;
    this.canvas = document.createElement('canvas');
    this.canvas.style.position = 'absolute';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.zIndex = '19';
    this.canvas.style.opacity = String(opacity);
    this.canvas.style.pointerEvents = 'none';
    this.canvas.width = map.current.getCanvas().width;
    this.canvas.height = map.current.getCanvas().height;
    this.canvas.style.width = `${map.current.getContainer().clientWidth}px`;
    this.canvas.style.height = `${map.current.getContainer().clientHeight}px`;

    this.windy = new (window as any).Windy({
      canvas: this.canvas,
      data: [velocityDataU, velocityDataV],
      settings: {
        velocityScale: 0.7,
        intensityScaleStep: 1,
        maxWindIntensity: 5,
        maxParticleAge: 100,
        particleLineWidth: 1.5,
        particleMultiplier: 2 / 30,
        particleReduction: 0.5,
        frameRate: 60,
        boundary: 0.45
      }
    });
    map.current.getContainer().appendChild(this.canvas);
    let timeout: any;

    const resetWind = () => {
      if (!this.canvas) return;
      const obj = getEventObject();
      const { zoomLevel, north, south, west, east, width, height } = obj;
      this.canvas.style.display = 'none';
      if (this.windy) {
        this.windy.stop();
      }
      if (timeout) {
        clearTimeout(timeout);
      }
      timeout = setTimeout(() => {
        if (!this.canvas) return;
        let particleWidth = 0.8;
        if (zoomLevel > 2) {
          particleWidth = 0.6;
        }
        if (zoomLevel > 3) {
          particleWidth = 0.4;
        }
        if (zoomLevel > 4) {
          particleWidth = 0.2;
        }
        if (zoomLevel > 5) {
          particleWidth = 0.07;
        }
        if (zoomLevel > 6) {
          particleWidth = 0.05;
        }
        this.canvas.style.display = 'initial';
        this.canvas.width = width;
        this.canvas.height = height;
        this.windy.start(
          [
            [0, 0],
            [width, height]
          ],
          width,
          height,
          [
            [west, south],
            [east, north]
          ],
          { particleLineWidth: particleWidth }
        );
      }, 500);
    };

    function getEventObject() {
      const canvas = map.current.getCanvas();
      const dimensions = map.current.getBounds();

      const result = {
        width: canvas.width,
        height: canvas.height,
        north: dimensions.getNorth(),
        south: dimensions.getSouth(),
        west: dimensions.getWest(),
        east: dimensions.getEast(),
        zoomLevel: map.current.getZoom()
      };
      return result;
    }

    map.current.on('resize', resetWind);
    map.current.on('move', resetWind);
    map.current.on('moveend', resetWind);
    map.current.on('zoom', resetWind);

    map.current.once('style.load', function () {
      resetWind();
    });

    resetWind();
  }
}
