import { Observable } from 'rxjs';
import { AttributeListApiServiceModel } from './attribute-list-api-service.model';

export interface TabModel {
  id: string;
  label: string;
}

/**
 * Configuration for an attribute list data source.
 *
 * Sources implementing this interface can be registered to provide tabs and data
 * to the attribute list component. Each source is responsible for defining its
 * own tabs and providing a data loader implementation for those tabs.
 */
export interface AttributeListSourceModel {
  /**
   * Unique identifier for this source.
   */
  id: string;
  /**
   * Observable stream of tabs that this source provides.
   * The attribute list component will subscribe to this to get the available tabs.
   */
  tabs$: Observable<TabModel[]>;
  /**
   * Implementation that loads data for this source's tabs.
   * This service is used by the attribute list component to fetch tab data.
   */
  dataLoader: AttributeListApiServiceModel;
}
