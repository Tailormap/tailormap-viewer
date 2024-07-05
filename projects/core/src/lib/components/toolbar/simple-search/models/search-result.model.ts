import { SearchResultItemModel } from './search-result-item.model';

export interface SearchResultModel {
  id: string;
  name: string;
  results: SearchResultItemModel[];
  attribution: string;
}
