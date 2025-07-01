import { keyable } from '@/entities/models/keyable';
import chroma from 'chroma-js';
import proj4 from 'proj4';
import { colorScaleByName } from './jsColormaps';

export const colorScale = chroma.scale(['#f00', '#0f0', '#00f', 'gray']).mode('hsl').colors(100);

export const defaultOpacity = 0.7;

export function parseRangeString(rangeStr: string): number[] | string[] {
  let match = rangeStr.match(/range\((\d+),\s*(\d+),\s*(\d+)\)/);
  let time = false;
  if (!match) {
    match = rangeStr.match(/range\((\d{4}-\d{2}-\d{2}),\s*(\d{4}-\d{2}-\d{2}),\s*day=(\d+)\)/);
    if (!match) {
      throw new Error('Invalid range string format');
    }
    time = true;
  }
  const [, startStr, endStr, stepStr] = match;
  if (time) {
    const startDate = new Date(startStr);
    const endDate = new Date(endStr);
    const step = parseInt(stepStr, 10);
    const result: string[] = [];
    for (let date = startDate; date <= endDate; date.setDate(date.getDate() + step)) {
      result.push(date.toISOString().split('T')[0]);
    }
    return result;
  }
  const start = parseInt(startStr, 10);
  const end = parseInt(endStr, 10);
  const step = parseInt(stepStr, 10);

  const result: number[] = [];
  for (let i = start; i < end; i += step) {
    result.push(i);
  }
  return result;
}

export function calculateColorsForLegend(colors: any, scale: any, n: number, rgb = false) {
  const colorScale: any = rgb ? chroma.scale(colors).domain(scale) : colorScaleByName(colors);
  const difValues = scale[1] - scale[0];
  const listColors: any = [];
  const listColorsValues: number[] = [];
  if (rgb) {
    for (let i = 0; i < n; i++) {
      const color = colorScale((1 / (n - 1)) * i);
      listColors.push([color._rgb[0], color._rgb[1], color._rgb[2]]);
      listColorsValues.push(Number(scale[0]) + (difValues / (n - 1)) * i);
    }
  } else {
    for (let i = 0; i < n; i++) {
      listColors.push(colorScale((1 / (n - 1)) * i));
      listColorsValues.push(Number(scale[0]) + (difValues / (n - 1)) * i);
    }
  }
  return { listColors, listColorsValues };
}

export function reprojectGeometry(geometry, sourceProjection, targetProjection) {
  if (geometry.type === 'Point') {
    return {
      type: 'Point',
      coordinates: proj4(sourceProjection, targetProjection, geometry.coordinates)
    };
  } else if (geometry.type === 'LineString') {
    return {
      type: 'LineString',
      coordinates: geometry.coordinates.map(coord =>
        proj4(sourceProjection, targetProjection, coord)
      )
    };
  } else if (geometry.type === 'Polygon') {
    return {
      type: 'Polygon',
      coordinates: geometry.coordinates.map(ring =>
        ring.map(coord => proj4(sourceProjection, targetProjection, coord))
      )
    };
  } else if (geometry.type === 'MultiPoint') {
    return {
      type: 'MultiPoint',
      coordinates: geometry.coordinates.map(coord =>
        proj4(sourceProjection, targetProjection, coord)
      )
    };
  } else if (geometry.type === 'MultiLineString') {
    return {
      type: 'MultiLineString',
      coordinates: geometry.coordinates.map(line =>
        line.map(coord => proj4(sourceProjection, targetProjection, coord))
      )
    };
  } else if (geometry.type === 'MultiPolygon') {
    return {
      type: 'MultiPolygon',
      coordinates: geometry.coordinates.map(polygon =>
        polygon.map(ring => ring.map(coord => proj4(sourceProjection, targetProjection, coord)))
      )
    };
  } else {
    return geometry;
  }
}

proj4.defs('EPSG:32630', '+proj=utm +zone=30 +datum=WGS84 +units=m +no_defs');
proj4.defs('EPSG:4326', '+proj=longlat +datum=WGS84 +no_defs');
proj4.defs('urn:ogc:def:crs:EPSG::32630', proj4.defs['EPSG:32630']);
proj4.defs('urn:ogc:def:crs:OGC:1.3:CRS84', proj4.defs['EPSG:4326']);

export const reprojectGeoJSON = geoJsonData => {
  const fromCRS = geoJsonData.crs?.properties?.name || 'EPSG:4326';
  const toCRS = 'EPSG:4326';

  if (fromCRS === toCRS) {
    return geoJsonData;
  }
  const reprojectedFeatures = geoJsonData.features.map(feature => {
    const reprojectedGeometry = {
      ...feature.geometry,
      coordinates: reprojectCoordinates(feature.geometry.coordinates, fromCRS, toCRS)
    };
    return {
      ...feature,
      geometry: reprojectedGeometry
    };
  });

  return {
    ...geoJsonData,
    features: reprojectedFeatures
  };
};

const reprojectCoordinates = (coordinates, fromCRS, toCRS) => {
  if (Array.isArray(coordinates[0])) {
    return coordinates.map(coord => reprojectCoordinates(coord, fromCRS, toCRS));
  }
  return proj4(fromCRS, toCRS, coordinates);
};

export function reprojectData(geojsonData, sourceProjection, targetProjection) {
  return {
    ...geojsonData,
    features: geojsonData.features.map(feature => ({
      ...feature,
      geometry: reprojectGeometry(feature.geometry, sourceProjection, targetProjection)
    }))
  };
}

export const TILE_SERVER_URL: string =
  process.env.NEXT_PUBLIC_TILE_SERVER_URL || 'https://imfe-pilot-tileserver.noc.ac.uk/';

export const ZARR_TILE_SERVER_URL: string =
  process.env.NEXT_PUBLIC_ZARR_TILE_SERVER_URL || 'https://atlantis44.xyz/';

export const defaultView: [number, number] = [54, 0];
export const defaultZoom = 6;

export const defaultMaxZoom = 30;
export const defaultWMSBounds: [[number, number], [number, number]] = [
  [50, -4],
  [58, 4]
];

export const defaultWMSBoundsMapbox: [[number, number], [number, number]] = [
  [-4, 50],
  [4, 58]
];

export function getUrlTileServer(layerName: keyable, url: string) {
  let newUrl: string = layerName.signed_url ? (layerName.signed_url as string) : url;
  if (layerName.dimensions) {
    Object.keys(layerName.dimensions).forEach(dimension => {
      const selectedDimension =
        layerName.dimensions[dimension].values[layerName.dimensions[dimension].selected];
      newUrl = newUrl.replace(`((${dimension}))`, selectedDimension);
    });
  }
  const isUrlEncoded: boolean = !!layerName.signed_url;
  return [newUrl, isUrlEncoded];
}

export function convertProjection(source: string, dest: string, point: [number, number]) {
  return proj4(source, dest).forward([point[0], point[1]]);
}

export async function getWCSUrl(wcsUrl, width, height, layer, dimensions = {}) {
  let url: string = `${wcsUrl}/wcs?service=WCS&version=2.0.1&request=GetCoverage&coverageId=${layer}&format=image/geotiff&SCALESIZE=i(${width}),j(${height})`;
  if (dimensions) {
    Object.keys(dimensions).forEach(dimension => {
      const selectedDimension = dimensions[dimension].values[dimensions[dimension].selected];
      const dimensionCapitalized = dimension.charAt(0).toUpperCase() + dimension.slice(1);
      url += `&subset=${dimensionCapitalized}("${selectedDimension}")`;
    });
  }
  return url;
}

export async function getZarrWCSUrl(url, layerInfo, position) {
  const params = {
    url: url + layerInfo.params.layers[position],
    variable: layerInfo.params.variable[position],
    reference: false,
    decode_times: true,
    consolidated: true,
    date_time: '',
    drop_dim: ''
  };
  let dropDims = '';
  Object.keys(layerInfo.dimensions).forEach(dimension => {
    if (dimension === 'time') {
      params.date_time =
        layerInfo.dimensions.time.values[layerInfo.dimensions.time.selected].split('T')[0];
    } else {
      const dimensionValue =
        layerInfo.dimensions[dimension].values[layerInfo.dimensions[dimension].selected];
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
  const newUrl = `${ZARR_TILE_SERVER_URL}wcs?${queryString}`;
  return newUrl;
}

export function parseCapabilities(xml) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xml, 'text/xml');
  const layers: keyable = {};
  const layerNodes = xmlDoc.getElementsByTagName('Layer');
  for (let i = 0; i < layerNodes.length; i++) {
    const styles: string[] = [];
    const legends: string[] = [];
    const layerNode = layerNodes[i];
    const layerName = layerNode.getElementsByTagName('Name')[0].textContent || '';
    const styleNodes = layerNode.getElementsByTagName('Style');
    for (let j = 0; j < styleNodes.length; j++) {
      const styleNode = styleNodes[j];
      const styleName: string = styleNode.getElementsByTagName('Name')[0].textContent || '';
      const legendName = styleNode.getElementsByTagName('LegendURL')[0];
      const onlineResource: string =
        legendName.getElementsByTagName('OnlineResource')[0].getAttribute('xlink:href') || '';
      legends.push(onlineResource);
      styles.push(styleName);
    }
    const boundingBoxNode = layerNode.getElementsByTagName('BoundingBox')[0];
    let bbox: string[] | null = null;

    if (boundingBoxNode) {
      bbox = [
        boundingBoxNode.getAttribute('minx') || '',
        boundingBoxNode.getAttribute('miny') || '',
        boundingBoxNode.getAttribute('maxx') || '',
        boundingBoxNode.getAttribute('maxy') || ''
      ];
    }
    const dimensions = {};
    const dimensionNodes = layerNode.getElementsByTagName('Dimension');
    for (let j = 0; j < dimensionNodes.length; j++) {
      const dimensionNode = dimensionNodes[j];
      const dimensionName = dimensionNode.getAttribute('name') || '';
      const values = dimensionNode.textContent ? dimensionNode.textContent.split(',') : [];
      const selected = 0;
      dimensions[dimensionName] = { values, selected };
    }
    layers[layerName] = { styles, legends, bbox, dimensions };
  }
  return layers;
}

export async function getLegendCapabilities(url: string, layer: string) {
  try {
    const newUrl = `${url}?service=WMS&request=GetCapabilities`;
    const response = await fetch(newUrl);
    const text = await response.text();

    const layers = parseCapabilities(text);
    const searchAbleLayer = Array.isArray(layer) ? layer[0] : layer;
    const localLayer = layers[searchAbleLayer];
    localLayer.legends.forEach((legend: string, index: number) => {
      if (legend.includes('amp;')) {
        localLayer.legends[index] = legend.replace('amp;', '');
      }
    });
    return localLayer;
  } catch (error) {
    console.log('Error fetching legend capabilities:', error);
    return {};
  }
}
