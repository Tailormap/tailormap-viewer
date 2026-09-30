import { Injectable } from '@angular/core';
import { UploadRemoveServiceModel } from '../components/select-upload/models/upload-remove-service.model';
import { of } from 'rxjs';

@Injectable()
export class LayerAttachedFileRemoveService implements UploadRemoveServiceModel {
  public isImageInUse$(_imageId: string) {
    return of([]);
  }
}
