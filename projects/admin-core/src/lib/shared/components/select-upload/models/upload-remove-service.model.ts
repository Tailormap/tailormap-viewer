import { Observable } from 'rxjs';

export interface UploadInUseItem {
  id: string;
  name: string;
  url: string;
}

export interface UploadRemoveServiceModel {
  isImageInUse$: (fileId: string) => Observable<UploadInUseItem[]>;
}
