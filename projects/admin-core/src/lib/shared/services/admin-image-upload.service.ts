import { catchError, concatMap, Observable, of, take } from 'rxjs';
import { map } from 'rxjs/operators';
import { TailormapAdminApiV1Service } from '@tailormap-admin/admin-api';
import { ImageUploadHelper } from '../helpers/image-upload.helper';
import { Injectable, inject } from '@angular/core';
import { UploadCategoryEnum, UploadedFileHelper } from '@tailormap-viewer/api';
import { UploadModel } from '@tailormap-admin/admin-api';
import { FileHelper } from '@tailormap-viewer/shared';

export interface ImageUploadResult {
  url?: string;
  error?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AdminImageUploadService {
  private adminApiService = inject(TailormapAdminApiV1Service);

  /**
   * Uploads an image in the IMAGE category, returns the public URL of the uploaded image.
   */
  public uploadImage$(file: File): Observable<ImageUploadResult | null> {
    return this.upload$(file, UploadCategoryEnum.IMAGE,
      upload => UploadedFileHelper.getUrlForFile(upload.id, upload.category, upload.filename));
  }

  /**
   * Uploads an image in the LAYER_ATTACHED_FILE category, returns an `upload://<id>` reference. The backend replaces
   * these references in layer descriptions by the URL of the upload for the layer.
   */
  public uploadLayerAttachedImage$(file: File): Observable<ImageUploadResult | null> {
    return this.upload$(file, UploadCategoryEnum.LAYER_ATTACHED_FILE, upload => `upload://${upload.id}`);
  }

  private upload$(file: File, category: UploadCategoryEnum, getUrl: (upload: UploadModel) => string): Observable<ImageUploadResult | null> {
    return ImageUploadHelper.readFileAsImage$(file, 2)
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
            category,
            mimeType: parsed.mimeType,
          })
            .pipe(
              take(1),
              catchError(() => of(null)),
              map(uploadResult => {
                return uploadResult ? { url: getUrl(uploadResult) } : null;
              }),
            );
        }),
      );
  }

}
