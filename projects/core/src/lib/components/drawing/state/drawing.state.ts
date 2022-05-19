import { DrawingFeatureModel } from '../models/drawing-feature.model';
import { DrawingFeatureTypeEnum } from '../models/drawing-feature-type.enum';

export const drawingStateKey = 'drawing';

export interface DrawingState {
  features: DrawingFeatureModel[];
  selectedFeature: string | null;
  selectedDrawingStyle: DrawingFeatureTypeEnum | null;
}

const dummyFeatures: DrawingFeatureModel[] = [
  {
    __fid: 'drawing-1',
    geometry: 'POINT(131243.54 459671.54)',
    attributes: {
      type: DrawingFeatureTypeEnum.POINT,
      style: {
        marker: 'diamond',
        markerFillColor: '#6236ff',
        markerStrokeColor: '#6236ff',
        markerSize: 15,
        fillOpacity: 30,
        fillColor: '#6236ff',
        strokeColor: '#6236ff',
        strokeOpacity: 100,
        strokeWidth: 3,
        label: '',
      },
    },
  },
  {
    __fid: 'uAOOB5LeH5BSE9zSOOuXy',
    geometry: 'POINT(131252.43 459562.52)',
    attributes: {
      type: DrawingFeatureTypeEnum.POINT,
      style: {
        marker: 'star',
        markerFillColor: '#6236ff',
        markerStrokeColor: '#6236ff',
        markerSize: 15,
        fillOpacity: 30,
        fillColor: '#6236ff',
        strokeColor: '#6236ff',
        strokeOpacity: 100,
        strokeWidth: 3,
        label: '',
      },
    },
  },
  {
    __fid: 'fkeLM1KoiV43TnsKqcMi8',
    geometry: 'POINT(131252.43 459426.81)',
    attributes: {
      type: DrawingFeatureTypeEnum.POINT,
      style: {
        marker: 'cross',
        markerFillColor: '#6236ff',
        markerStrokeColor: '#6236ff',
        markerSize: 15,
        fillOpacity: 30,
        fillColor: '#6236ff',
        strokeColor: '#6236ff',
        strokeOpacity: 100,
        strokeWidth: 3,
        label: '',
      },
    },
  },
  {
    __fid: '3ZFyhtUcnDV1aOZb1QIXO',
    geometry: 'POINT(131254.66 459288.87)',
    attributes: {
      type: DrawingFeatureTypeEnum.POINT,
      style: {
        marker: 'arrow',
        markerFillColor: '#6236ff',
        markerStrokeColor: '#6236ff',
        markerSize: 15,
        fillOpacity: 30,
        fillColor: '#6236ff',
        strokeColor: '#6236ff',
        strokeOpacity: 100,
        strokeWidth: 3,
        label: '',
      },
    },
  },
  {
    __fid: 'mVieQGMsrbqKTRtNQgddP',
    geometry: 'POINT(131265.78 459137.59)',
    attributes: {
      type: DrawingFeatureTypeEnum.POINT,
      style: {
        marker: 'triangle',
        markerFillColor: '#6236ff',
        markerStrokeColor: '#6236ff',
        markerSize: 15,
        fillOpacity: 30,
        fillColor: '#6236ff',
        strokeColor: '#6236ff',
        strokeOpacity: 100,
        strokeWidth: 3,
        label: '',
      },
    },
  },
  {
    __fid: 'RvzMlEVUjbZVoMlrJrYVe',
    geometry: 'POINT(131276.91 458986.3)',
    attributes: {
      type: DrawingFeatureTypeEnum.POINT,
      style: {
        marker: 'square',
        markerFillColor: '#6236ff',
        markerStrokeColor: '#6236ff',
        markerSize: 15,
        fillOpacity: 30,
        fillColor: '#6236ff',
        strokeColor: '#6236ff',
        strokeOpacity: 100,
        strokeWidth: 3,
        label: '',
      },
    },
  },
  {
    __fid: 'P5AnCnoLyfHMTKMQmppkp',
    geometry: 'POINT(131279.13 458839.47)',
    attributes: {
      type: DrawingFeatureTypeEnum.POINT,
      style: {
        marker: 'circle',
        markerFillColor: '#6236ff',
        markerStrokeColor: '#6236ff',
        markerSize: 15,
        fillOpacity: 30,
        fillColor: '#6236ff',
        strokeColor: '#6236ff',
        strokeOpacity: 100,
        strokeWidth: 3,
        label: '',
      },
    },
  },
  {
    __fid: 'riw5UbV2rnyfXm8RdjJiw',
    geometry: 'POINT(131281.36 458690.4)',
    attributes: {
      type: DrawingFeatureTypeEnum.POINT,
      style: {
        marker: 'circle',
        markerFillColor: '#6236ff',
        markerStrokeColor: '#6236ff',
        markerSize: 5,
        fillOpacity: 30,
        fillColor: '#6236ff',
        strokeColor: '#6236ff',
        strokeOpacity: 100,
        strokeWidth: 3,
        label: 'Some label',
      },
    },
  },
  {
    __fid: '5SsBICSSncokI0XyMTObx',
    geometry: 'POLYGON((130996.58 459791.68,131457.12 459789.45,131508.29 458554.69,131078.9 458568.04,130996.58 459791.68))',
    attributes: {
      type: DrawingFeatureTypeEnum.POLYGON,
      style: {
        marker: 'circle',
        markerFillColor: '#6236ff',
        markerStrokeColor: '#6236ff',
        markerSize: 5,
        fillOpacity: 100,
        fillColor: 'rgb(255, 255, 255)',
        strokeColor: '#6236ff',
        strokeOpacity: 100,
        strokeWidth: 3,
        label: '',
      },
    },
  },
];

export const initialDrawingState: DrawingState = {
  features: dummyFeatures,
  selectedFeature: '3ZFyhtUcnDV1aOZb1QIXO',
  selectedDrawingStyle: null,
};
