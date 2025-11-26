// eslint-disable-next-line no-restricted-imports
import { catchError, concatMap, Observable, of, take } from 'rxjs';
import { map } from 'rxjs/operators';
import { TailormapAdminApiV1Service } from './tailormap-admin-api-v1.service';
import { ImageHelper } from '../helpers/image.helper';
import { UploadHelper } from '../helpers/upload.helper';
import { Injectable, inject } from '@angular/core';
import { UploadCategoryEnum } from '../models';

export interface ImageUploadResult {
  url?: string;
  error?: string;
}

@Injectable({
  providedIn: 'root',
})
export class TailormapAdminUploadService {
  private adminApiService = inject(TailormapAdminApiV1Service);


  public uploadImage$(file: File): Observable<ImageUploadResult | null> {
    return ImageHelper.readFileAsImage$(file, 2, 600)
      .pipe(
        concatMap(result => {
          if (result?.error) {
            return of({ error: result.error });
          }
          if (!result || !result.image || !result.fileName) {
            return of(null);
          }
          const { image, mimeType } = UploadHelper.prepareBase64(result.image);
          return this.adminApiService.createUpload$({
            content: image,
            filename: result.fileName,
            category: UploadCategoryEnum.IMAGE,
            mimeType,
          })
            .pipe(
              take(1),
              catchError(() => of(null)),
              map(uploadResult => {
                return uploadResult
                  ? { url: UploadHelper.getUrlForFile(uploadResult.id, uploadResult.category, uploadResult.filename) }
                  : null;
              }),
            );
        }),
      );
  }

}
