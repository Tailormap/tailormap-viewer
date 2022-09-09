import { OpenLayersLayerManager } from '../open-layers-layer-manager';
import { isOpenLayersWMSLayer } from '../../helpers/ol-layer-types.helper';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { WFS } from 'ol/format';
import { Feature, FeatureCollection, GeoJsonProperties } from 'geojson';
import { map, Observable, of } from 'rxjs';
import { FeatureModel } from '@tailormap-viewer/api';

export class OpenLayersWmsGetFeatureInfoHelper {

  private static idCount = 0;
  private static isValidFeature = (item: FeatureModel | null): item is FeatureModel => item !== null;

  public static getFeatureInfoForLayer$(
    httpClient: HttpClient,
    layerId: string,
    coordinates: [number, number],
    resolution: number,
    projection: string,
    layerManager: OpenLayersLayerManager,
  ): Observable<FeatureModel[]> {
    const layer = layerManager.getLayer(layerId);
    if (!layer || !isOpenLayersWMSLayer(layer)) {
      return of([]);
    }
    const source = layer.getSource();
    if (!source) {
      return of([]);
    }
    const params = source.getParams();
    const queryLayers = params.QUERY_LAYERS || params.LAYERS || undefined;
    const url = source.getFeatureInfoUrl(coordinates, resolution, projection, {
      INFO_FORMAT: 'application/json',
      QUERY_LAYERS: queryLayers,
    });
    if (!url) {
      return of([]);
    }
    return httpClient.get(url, { responseType: 'text', observe: 'response' })
      .pipe(
        map(response => OpenLayersWmsGetFeatureInfoHelper.parseFeatureInfoResponse(response)),
      );
  }

  private static parseFeatureInfoResponse(response: HttpResponse<string>): Array<FeatureModel> {
    const contentType = response.headers.get('Content-Type');
    if (!contentType || !response.body) {
      return [];
    }
    if (contentType.indexOf('application/json') !== -1) {
      return OpenLayersWmsGetFeatureInfoHelper.parseJsonResponse(response.body);
    }
    if (contentType.indexOf('application/vnd.ogc.gml') !== -1) {
      return OpenLayersWmsGetFeatureInfoHelper.parseGmlResponse(response.body);
    }
    if (contentType.indexOf('text/plain') !== -1) {
      return OpenLayersWmsGetFeatureInfoHelper.parsePlainTextResponse(response.body);
    }
    return [];
  }

  private static parseJsonResponse(responseBody: string): FeatureModel[] {
    try {
      const features = OpenLayersWmsGetFeatureInfoHelper.getFeatures(JSON.parse(responseBody));
      if (features.length) {
        return features
          .map((feature) => OpenLayersWmsGetFeatureInfoHelper.getFeatureModel(feature.properties))
          .filter(OpenLayersWmsGetFeatureInfoHelper.isValidFeature);
      }
    } catch (e) {}
    return [];
  }

  private static parseGmlResponse(responseBody: string): FeatureModel[] {
    try {
      const features = (new WFS()).readFeatures(responseBody);
      if (features.length) {
        return features
          .map((feature) => OpenLayersWmsGetFeatureInfoHelper.getFeatureModel(feature.getProperties()))
          .filter(OpenLayersWmsGetFeatureInfoHelper.isValidFeature);
      }
    } catch (e) {}
    return [];
  }

  private static parsePlainTextResponse(responseBody: string): FeatureModel[] {
    const lines = responseBody.split('\n');
    const regex = new RegExp('.* = *.');
    const properties: Record<string, string> = {};
    lines.forEach((line) => {
      if (regex.test(line)) {
        const [ key, value ] = line.split('=').map((str) => str.trim());
        properties[key] = value;
      }
    });
    return [OpenLayersWmsGetFeatureInfoHelper.getFeatureModel(properties)]
      .filter(OpenLayersWmsGetFeatureInfoHelper.isValidFeature);
  }

  private static getFeatureModel(properties: GeoJsonProperties): FeatureModel | null {
    if (!properties) {
      return null;
    }
    return {
      __fid: `wms-get-feature-info-${OpenLayersWmsGetFeatureInfoHelper.idCount++}`,
      attributes: properties,
    };
  }

  private static getFeatures(result: object): Feature[] {
    if (OpenLayersWmsGetFeatureInfoHelper.isFeatureCollection(result)) {
      return result.features;
    }
    if (Array.isArray(result)) {
      return result;
    }
    return [];
  }

  private static isFeatureCollection(result: any): result is FeatureCollection {
    return result.type === 'FeatureCollection' && Array.isArray(result.features);
  }

}
