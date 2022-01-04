import { Injectable } from '@angular/core';
import {
  AppLayerModel, AppResponseModel, ComponentModel, GeometryType, Language, LayerDetailsModel, MapResponseModel, ServiceProtocol,
} from '../models';
import { Observable, of } from 'rxjs';
import { TailormapApiV1ServiceModel } from './tailormap-api-v1.service.model';

@Injectable()
export class TailormapApiV1MockService implements TailormapApiV1ServiceModel {

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
      baseLayers: [],
      services: [{
        id: 1,
        name: 'Openbasiskaart',
        protocol: ServiceProtocol.WMS,
        url: 'https://www.openbasiskaart.nl/mapcache/?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetCapabilities',
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

  public getLayers$(_applicationId: number): Observable<AppLayerModel[]> {
    return of([{
      id: 1,
      visible: true,
      serviceId: 1,
      url: 'https://www.openbasiskaart.nl/mapcache/?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetCapabilities',
      displayName: 'osm-nb-hq',
      crs: {
        code: 'EPSG:28992',
        definition: '',
      },
      isBaseLayer: false,
    }]);
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

}
