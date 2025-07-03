import { md5 } from "js-md5";
import { Observable } from 'rxjs';
import { UploadedImageHelper } from '@tailormap-viewer/api';

export class UploadHelper {

  public static getUrlForFile(id: string, category: string, fileName: string = 't') {
    return UploadedImageHelper.getUrlForFile(id, category, fileName);
  }

  public static prepareBase64(image: string) {
    const dataIdx = image.indexOf('data:');
    const base64Idx = image.indexOf(';base64,');
    let mimeType: string | undefined = undefined;
    if (dataIdx === 0 && base64Idx !== -1) {
      mimeType = image.substring(dataIdx + 5, base64Idx);
      image = image.substring(base64Idx + 8);
    }
    return { image, mimeType };
  }

  public static getMd5HashForFile$(file: File): Observable<string> {
    return new Observable<string>(observer => {
      file.arrayBuffer().then(buffer => {
        observer.next(md5(buffer));
        observer.complete();
      }).catch(() => {
        observer.error(new Error('Failed to read file for MD5 hash calculation'));
        observer.complete();
      });
    });
  }

}
