import { SearchIndexStatusEnum } from './search-index-status.enum';
import { TaskSchedule } from './taskschedule.model';

export interface SearchIndexModel {
  id: number;
  featureTypeId: number;
  lastIndexed: Date | string | null;
  name: string;
  status: SearchIndexStatusEnum;
  comment: string;
  searchFieldsUsed: string[];
  searchDisplayFieldsUsed: string[];
  schedule?: TaskSchedule;
}
