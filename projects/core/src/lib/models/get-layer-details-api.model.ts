import { Observable } from 'rxjs';
import { LayerDetailsModel } from '@tailormap-viewer/api';
import { GetLayerDetailsParams } from './get-layer-details-param.model';

export interface GetLayerDetailsApiModel {
  getLayerDetails$(params: GetLayerDetailsParams): Observable<LayerDetailsModel | null>;
}
