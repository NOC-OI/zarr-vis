export const layersJson = {
  COG: {
    layerNames: {
      'Bathymetry_EMODNET-2022': {
        url: 'https://pilot-imfe-o.s3-ext.jc.rl.ac.uk/haig-fras/layers/bathymetry/emodnet/emodnet_2022.tif',
        dataType: 'COG',
        content:
          "The 'EMODnet Digital Bathymetry (DTM)- 2022' is a multilayer bathymetric product for Europe’s sea basins covering: • the Greater North Sea, including the Kattegat and stretches of water such as Fair Isle, Cromarty, Forth, Forties,Dover, Wight, and Portland • the English Channel and Celtic Seas • Western Mediterranean, the Ionian Sea and the Central Mediterranean Sea • Iberian Coast and Bay of Biscay (Atlantic Ocean) • Adriatic Sea (Mediterranean) • Aegean - Levantine Sea (Mediterranean). • Madeira and Azores (Macaronesia) • Baltic Sea • Black Sea • Norwegian and Icelandic Seas • Canary Islands (Macaronesia) • Arctic region and Barentz Sea The DTM is based upon 21937 bathymetric survey data sets and Composite DTMs that have been gathered from 64 data providers from 28 countries riparian to European seas and beyond. Also Satellite Derived Bathymetry data products have been included fro Landsat 8 and Sentinel satellite images. Areas not covered by observations are completed by integrating GEBCO 2022 and IBCAO V4.\n Source: https://emodnet.ec.europa.eu/geonetwork/emodnet/eng/catalog.search#/metadata/ff3aff8a-cff1-44a3-a2c8-1910bf109f85",
        protected: false,
        dataDescription: ['Depth', '(m)'],
        download: {
          GeoTIFF:
            'https://pilot-imfe-o.s3-ext.jc.rl.ac.uk/haig-fras/layers/bathymetry/gebco/gebco_2023.tif',
          metadata:
            'https://radiantearth.github.io/stac-browser/#/external/ceeds-tool-store.s3-ext.jc.rl.ac.uk/ceeds/stac/Bathymetry/EMODNET/collection.json'
        },
        bbox: [-9.000000000012616, 47.999887816640324, 3.100668943151864, 60.30104166662717]
      },
      'Bathymetry_GEBCO-2023': {
        url: 'https://pilot-imfe-o.s3-ext.jc.rl.ac.uk/haig-fras/layers/bathymetry/gebco/gebco_2023.tif',
        dataType: 'COG',
        content:
          'GEBCO’s current gridded bathymetric data set, the GEBCO_2023 Grid, is a global terrain model for ocean and land, providing elevation data, in meters, on a 15 arc-second interval grid. It is accompanied by a Type Identifier (TID) Grid that gives information on the types of source data that the GEBCO_2023 Grid is based on.\n Source: https://www.gebco.net/data_and_products/gridded_bathymetry_data/',
        protected: false,
        dataDescription: ['Depth', '(m)'],
        download: {
          GeoTIFF:
            'https://pilot-imfe-o.s3-ext.jc.rl.ac.uk/haig-fras/layers/bathymetry/gebco/gebco_2023.tif',
          metadata:
            'https://radiantearth.github.io/stac-browser/#/external/ceeds-tool-store.s3-ext.jc.rl.ac.uk/ceeds/stac/Bathymetry/GEBCO/collection.json'
        },
        bbox: [-180, -90, 179.96586288941216, 90]
      }
    }
  },
  ZARR_zarrgl: {
    layerNames: {
      'sos_abs.zarr': {
        url: 'https://atlantis-vis-o.s3-ext.jc.rl.ac.uk/nemotest101/pyramid2/T1d/sos_abs.zarr',
        dataType: 'zarrgl',
        content:
          'The output of the NEMO model for sea surface absolute salinity. This model is run by the National Oceanography Centre.',
        params: {
          variable: 'sos_abs'
        },
        dimensions: {
          time: {
            selected: 0,
            values: 'range(1,152,1)'
          }
        },
        colors: 'jet',
        scale: [30, 37]
      }
    }
  },
  ZARR_carbonplan: {
    layerNames: {
      'sos_abs.zarr': {
        url: 'https://atlantis-vis-o.s3-ext.jc.rl.ac.uk/nemotest101/pyramid2/T1d/sos_abs.zarr',
        dataType: 'carbonplan',
        content:
          'The output of the NEMO model for sea surface absolute salinity. This model is run by the National Oceanography Centre.',
        params: {
          variable: 'sos_abs'
        },
        dimensions: {
          time: {
            selected: 0,
            values: 'range(1,152,1)'
          }
        },
        colors: 'jet',
        scale: [30, 37]
      }
    }
  },
  ZARR_titiler: {
    layerNames: {
      'sos_abs.zarr': {
        url: 'https://atlantis-vis-o.s3-ext.jc.rl.ac.uk/nemotest101/T1d/sos_abs.zarr',
        dataType: 'ZARR',
        content:
          'The output of the NEMO model for sea surface absolute salinity. This model is run by the National Oceanography Centre.',
        params: {
          variable: 'sos_abs'
        },
        scale: [30, 37]
      },
      'tos_con.zarr': {
        url: 'https://atlantis-vis-o.s3-ext.jc.rl.ac.uk/nemotest101/T1d/tos_con.zarr',
        dataType: 'ZARR',
        content: 'sea_surface_conservative_temperature',
        params: {
          variable: 'tos_con'
        },
        scale: [5, 15]
      },
      'Currents canvas': {
        url: 'https://atlantis-vis-o.s3-ext.jc.rl.ac.uk/',
        dataType: 'velocity-ZARR',
        content:
          'The output of the AMM15 model for ocean currents. This model is run by the MetOffice.',
        params: {
          layers: ['metoffice1/ocean/uo.zarr', 'metoffice1/ocean/vo.zarr'],
          variable: ['uo', 'vo'],
          additional_dims: ['model_timestamp_hours', 'z']
        }
      }
    }
  },
  GEOSERVER: {
    layerNames: {
      'Currents canvas': {
        url: 'https://geoserver.atlantis44.xyz/geoserver',
        dataType: 'velocity-geoserver',
        content:
          'The output of the AMM15 model for ocean currents. This model is run by the MetOffice.',
        params: {
          layers: [
            'metoffice_ocean:eastward_sea_water_velocity_20250224',
            'metoffice_ocean:northward_sea_water_velocity_20250224'
          ]
        }
      },
      'Currents U': {
        url: 'https://geoserver.atlantis44.xyz/geoserver/wms',
        dataType: 'WMS',
        content:
          'The output of the AMM15 model for eastward ocean currents. This model is run by the MetOffice.',
        params: {
          layers: 'metoffice_ocean:eastward_sea_water_velocity_20250224'
        }
      },
      'Currents V': {
        url: 'https://geoserver.atlantis44.xyz/geoserver/wms',
        dataType: 'WMS',
        content:
          'The output of the AMM15 model for northward ocean currents. This model is run by the MetOffice.',
        params: {
          layers: 'metoffice_ocean:northward_sea_water_velocity_20250224'
        }
      },
      'Curents Speed': {
        url: 'https://geoserver.atlantis44.xyz/geoserver/wms',
        dataType: 'WMS',
        content:
          'The output of the AMM15 model for ocean currents speed. This model is run by the MetOffice.',
        params: {
          layers: 'metoffice_ocean:sea_water_speed_20250224'
        }
      }
    }
  }
};
