import { Observable } from 'rxjs';
import { UploadModel } from '@tailormap-admin/admin-api';

export interface UploadInUseItem {
  upload?: UploadModel;
  id: string;
  name: string;
  url: string;
}

export interface UploadRemoveServiceModel {
  isUploadInUse$: (uploadId: string) => Observable<UploadInUseItem[]>;
}
