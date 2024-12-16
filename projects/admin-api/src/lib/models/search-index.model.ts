import { SearchIndexStatusEnum } from './search-index-status.enum';
import { TaskSchedule } from './taskschedule.model';
import { SearchIndexSummaryModel } from './search-index-summary.model';

export interface SearchIndexModel {
  id: number;
  featureTypeId: number;
  lastIndexed: Date | string | null;
  name: string;
  status: SearchIndexStatusEnum;
  searchFieldsUsed: string[];
  searchDisplayFieldsUsed: string[];
  schedule?: TaskSchedule;
  summary?: SearchIndexSummaryModel;
}
