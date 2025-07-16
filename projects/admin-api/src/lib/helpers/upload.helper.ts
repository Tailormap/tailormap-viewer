import { from, map, Observable, switchMap } from 'rxjs';
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

  public static arrayBufferToHex(buffer: ArrayBuffer): string {
    return Array.from(new Uint8Array(buffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  public static getSha1HashForArrayBuffer$(buffer: ArrayBuffer): Observable<string> {
    return from(crypto.subtle.digest('SHA-1', buffer)).pipe(
      map(hashBuffer => this.arrayBufferToHex(hashBuffer)),
    );
  }

  public static getSha1HashForFile$(file: File): Observable<string> {
    return from(file.arrayBuffer()).pipe(
      switchMap(buffer => this.getSha1HashForArrayBuffer$(buffer)),
    );
  }
}
