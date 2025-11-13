import { Observable } from 'rxjs';
import { AttributeListApiServiceModel } from './attribute-list-api-service.model';

export interface TabModel {
  id: string;
  label: string;
}

export interface AttributeListSourceModel {
  id: string;
  tabs$: Observable<TabModel[]>;
  dataLoader: AttributeListApiServiceModel;
}
