import { Injectable } from '@angular/core';
import {
  AppResponseModel, ComponentModel, GeometryType, Language, LayerDetailsModel, MapResponseModel, ServiceProtocol,
  VersionResponseModel,
} from '../models';
import { delay, Observable, of } from 'rxjs';
import { TailormapApiV1ServiceModel } from './tailormap-api-v1.service.model';
import { FeaturesResponseModel } from '../models/features-response.model';
import { FeatureAttributeTypeEnum } from '../models/feature-attribute-type.enum';

@Injectable()
export class TailormapApiV1MockService implements TailormapApiV1ServiceModel {

  public getVersion$(): Observable<VersionResponseModel> {
    return of({
      version: '0.1-SNAPSHOT',
      databaseversion: '47',
      apiVersion: 'v1',
    });
  }

  public getApplication$(_params: {
    name?: string;
    version?: string;
    id?: number;
  }): Observable<AppResponseModel> {
    return of({
      id: 1,
      name: 'Test',
      apiVersion: 'v1',
      lang: Language.NL_NL,
      title: 'Test',
    });
  }

  public getMap$(_applicationId: number): Observable<MapResponseModel> {
    return of({
      appLayers: [{
        id: 1,
        visible: true,
        serviceId: 1,
        layerName: 'osm-nb-hq',
        title: 'osm-nb-hq',
        crs: {
          code: 'EPSG:28992',
          definition: '',
        },
        isBaseLayer: false,
      },{
        id: 2,
        visible: true,
        serviceId: 2,
        layerName: 'gemeentegebied',
        title: 'Gemeentegebied',
        crs: {
          code: 'EPSG:28992',
          definition: '',
        },
        isBaseLayer: false,
      },{
        id: 3,
        visible: true,
        serviceId: 2,
        layerName: 'Provinciegebied',
        title: 'provinciegebied',
        crs: {
          code: 'EPSG:28992',
          definition: '',
        },
        isBaseLayer: false,
      }],
      baseLayerTreeNodes: [{
        id: 'rootbg',
        name: 'background',
        childrenIds: ['level-1'],
        root: true,
      }, {
        id: 'level-1',
        name: 'Openstreetmap',
        childrenIds: ['applayer-1'],
        root: false,
      }, {
        id: 'applayer-1',
        appLayerId: 1,
        name: 'osm-nb-hq',
        childrenIds: [],
        root: false,
      }],
      layerTreeNodes: [{
        id: 'root',
        name: 'root',
        childrenIds: ['level-2'],
        root: true,
      }, {
        id: 'level-2',
        name: 'Bestuurlijke Gebieden',
        childrenIds: ['applayer-2', 'applayer-3'],
        appLayerId: null,
        root: false,
      }, {
        id: 'applayer-2',
        appLayerId: 2,
        name: 'Gemeentegebied',
        childrenIds: [],
        root: false,
      }, {
        id: 'applayer-3',
        appLayerId: 3,
        name: 'Provinciegebied',
        childrenIds: [],
        root: false,
      }],
      services: [{
        id: 1,
        name: 'Openbasiskaart',
        protocol: ServiceProtocol.WMS,
        url: 'https://www.openbasiskaart.nl/mapcache/?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetCapabilities',
        styleLibraries: {},
        useProxy: false,
      },{
        id: 2,
        name: 'Bestuurlijke gebieden',
        protocol: ServiceProtocol.WMS,
        url: 'https://service.pdok.nl/kadaster/bestuurlijkegebieden/wms/v1_0?request=GetCapabilities&service=WMS',
        styleLibraries: {},
        useProxy: false,
      }],
      crs: {
        // eslint-disable-next-line max-len
        definition: '+proj=sterea +lat_0=52.15616055555555 +lon_0=5.38763888888889 +k=0.9999079 +x_0=155000 +y_0=463000 +ellps=bessel +towgs84=565.417,50.3319,465.552,-0.398957,0.343988,-1.8774,4.0725 +units=m +no_defs',
        code: 'EPSG:28992',
      },
      maxExtent: {
        crs: 'EPSG:28992',
          minx: -285401,
          miny: 22598,
          maxx: 595401,
          maxy: 903401,
      },
      initialExtent: {
        crs: 'EPSG:28992',
        minx: 123180,
        miny: 445478,
        maxx: 149359,
        maxy: 463194,
      },
    });
  }

  public getComponents$(_applicationId: number): Observable<ComponentModel[]> {
    return of([]);
  }

  public getDescribeLayer$(_params: {
    applicationId: number;
    layerId: number;
  }): Observable<LayerDetailsModel> {
    return of({
      id: 1,
      serviceId: 1,
      relations: [],
      geometryType: GeometryType.GEOMETRY,
      geometryAttributeIndex: 1,
      geometryAttribute: 'geom',
      metadata: null,
      featuretypeName: 'test',
      editable: false,
      attributes: [],
    });
  }

  public getFeatures$(_params: {
    applicationId: number;
    layerId: number;
    x?: number;
    y?: number;
    crs?: string;
    distance?: number;
    __fid?: string;
    simplify?: boolean;
    filter?: string;
    page?: number;
  }): Observable<FeaturesResponseModel> {
    return of({
      features: [
        { __fid: '1', attributes: { object_id: '0606100000013912',  valid_from: '2010-06-29', year: 1960, status: 'Pand in gebruik' }},
        { __fid: '2', attributes: { object_id: '0606100000017812',  valid_from: '2014-10-06', year: 2001, status: 'Pand in gebruik' }},
        { __fid: '3', attributes: { object_id: '0622100000041685',  valid_from: '1929-01-22', year: 1989, status: 'Pand in gebruik' }},
        { __fid: '4', attributes: { object_id: '0622100000041686',  valid_from: '1929-01-22', year: 1989, status: 'Pand in gebruik' }},
        { __fid: '5', attributes: { object_id: '0622100000041687',  valid_from: '1931-05-15', year: 1983, status: 'Pand in gebruik' }},
        { __fid: '6', attributes: { object_id: '0622100000041688',  valid_from: '2007-05-02', year: 1900, status: 'Pand in gebruik' }},
        { __fid: '7', attributes: { object_id: '0622100000041689',  valid_from: '2016-04-19', year: 1700, status: 'Pand in gebruik' }},
        { __fid: '8', attributes: { object_id: '0622100000041690',  valid_from: '2015-05-20', year: 1700, status: 'Pand in gebruik' }},
      ],
      columnMetadata: [
        { key: 'object_id', alias: 'Pand', type: FeatureAttributeTypeEnum.STRING },
        { key: 'valid_from', alias: 'Geldig vanaf', type: FeatureAttributeTypeEnum.DATE },
        { key: 'year', alias: 'Bouwjaar', type: FeatureAttributeTypeEnum.INTEGER },
        { key: 'status', alias: 'Status', type: FeatureAttributeTypeEnum.STRING },
      ],
      total: 8,
      page: null,
      pageSize: null,
    }).pipe(delay(3000));
  }

}
