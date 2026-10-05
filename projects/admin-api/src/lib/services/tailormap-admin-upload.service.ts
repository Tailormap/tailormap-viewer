import { catchError, concatMap, Observable, of, take } from 'rxjs';
import { map } from 'rxjs/operators';
import { TailormapAdminApiV1Service } from './tailormap-admin-api-v1.service';
import { ImageHelper } from '../helpers/image.helper';
import { Injectable, inject } from '@angular/core';
import { UploadCategoryEnum, UploadedFileHelper } from '@tailormap-viewer/api';
import { FileHelper } from '@tailormap-viewer/shared';

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
          const parsed = FileHelper.parseDataUrl(result.image);
          if (!parsed) {
            return of({ error: 'Invalid image data' });
          }
          return this.adminApiService.createUpload$({
            content: parsed.contentsBase64,
            filename: result.fileName,
            category: UploadCategoryEnum.IMAGE,
            mimeType: parsed.mimeType,
          })
            .pipe(
              take(1),
              catchError(() => of(null)),
              map(uploadResult => {
                return uploadResult
                  ? { url: UploadedFileHelper.getUrlForFile(uploadResult.id, uploadResult.category, uploadResult.filename) }
                  : null;
              }),
            );
        }),
      );
  }

}
