import { from, map, Observable, switchMap } from 'rxjs';
import { ArrayBufferHelper } from './array-buffer.helper';

export class HashHelper {
  public static getSha1HashForArrayBuffer$(buffer: ArrayBuffer): Observable<string> {
    return from(crypto.subtle.digest('SHA-1', buffer)).pipe(
      map(hashBuffer => ArrayBufferHelper.arrayBufferToHex(hashBuffer)),
    );
  }

  public static getSha1HashForFile$(file: File): Observable<string> {
    return from(file.arrayBuffer()).pipe(
      switchMap(buffer => this.getSha1HashForArrayBuffer$(buffer)),
    );
  }
}
