import { Observable } from 'rxjs';

export interface UploadInUseItem {
  id: string;
  name: string;
  url: string;
}

export interface UploadRemoveServiceModel {
  isUploadInUse$: (uploadId: string) => Observable<UploadInUseItem[]>;
}
