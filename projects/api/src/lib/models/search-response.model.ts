import { SearchDocumentModel } from './search-document.model';

export interface SearchResponseModel {
  start: number;
  total: number;
  maxScore: number;
  documents: SearchDocumentModel[];
}
