export const layersJson = {
  COG: {
    layerNames: {
      sos_abs: {
        url: 'https://atlantis-vis-o.s3-ext.jc.rl.ac.uk/nemotest101/T1m/cog/uo_time-((time)).tif',
        dataType: 'COG',
        content:
          'The output of the NEMO model for sea surface absolute salinity. This model is run by the National Oceanography Centre.',
        protected: false,
        dataDescription: ['Salinity', ''],
        colors: 'jet',
        scale: [30, 37],
        dimensions: {
          time: {
            selected: 0,
            values: 'range(2000-01-23,2000-06-30,day=1)'
          }
        }
      },
      'Bathymetry_GEBCO-2023': {
        url: 'https://pilot-imfe-o.s3-ext.jc.rl.ac.uk/haig-fras/layers/bathymetry/gebco/gebco_2023.tif',
        dataType: 'COG',
        content:
          'GEBCO’s current gridded bathymetric data set, the GEBCO_2023 Grid, is a global terrain model for ocean and land, providing elevation data, in meters, on a 15 arc-second interval grid. It is accompanied by a Type Identifier (TID) Grid that gives information on the types of source data that the GEBCO_2023 Grid is based on.\n Source: https://www.gebco.net/data_and_products/gridded_bathymetry_data/',
        protected: false,
        dataDescription: ['Depth', '(m)'],
        bbox: [-180, -90, 179.96586288941216, 90]
      }
    }
  },
  ZARR_zarrgl: {
    layerNames: {
      sos_abs: {
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
        dataDescription: ['Salinity', ''],
        colors: 'jet',
        scale: [30, 37]
      }
    }
  },
  ZARR_carbonplan: {
    layerNames: {
      sos_abs: {
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
        dataDescription: ['Salinity', ''],
        colors: 'jet',
        scale: [30, 37]
      }
    }
  },
  ZARR_titiler: {
    layerNames: {
      sos_abs: {
        url: 'https://atlantis-vis-o.s3-ext.jc.rl.ac.uk/nemotest101/T1d/sos_abs.zarr',
        dataType: 'ZARR',
        content:
          'The output of the NEMO model for sea surface absolute salinity. This model is run by the National Oceanography Centre.',
        params: {
          variable: 'sos_abs'
        },
        dataDescription: ['Salinity', ''],
        scale: [30, 37]
      },
      'Currents canvas': {
        url: 'https://atlantis-vis-o.s3-ext.jc.rl.ac.uk/',
        dataType: 'velocity-ZARR',
        content:
          'The output of the AMM15 model for ocean currents. This model is run by the MetOffice.',
        params: {
          layers: ['nemotest101/currents/uo.zarr', 'nemotest101/currents/vo.zarr'],
          variable: ['uo', 'vo'],
          additional_dims: ['z']
        }
      }
    }
  },
  GEOSERVER: {
    layerNames: {
      sos_abs: {
        url: 'https://geoserver.atlantis44.xyz/geoserver/wms',
        dataType: 'WMS',
        content:
          'The output of the AMM15 model for eastward ocean currents. This model is run by the MetOffice.',
        params: {
          layers: 'nemo_npd:sos_abs'
        }
      },
      'Currents canvas': {
        url: 'https://geoserver.atlantis44.xyz/geoserver',
        dataType: 'velocity-WMS',
        content:
          'The output of the AMM15 model for ocean currents. This model is run by the MetOffice.',
        params: {
          layers: ['nemo_npd:uo', 'nemo_npd:vo']
        }
      }
    }
  }
};
