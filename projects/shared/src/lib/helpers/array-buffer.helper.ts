import { from, map, Observable } from 'rxjs';

export class ArrayBufferHelper {

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

  public static bufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode( bytes[ i ] );
    }
    return window.btoa( binary );
  }
}
