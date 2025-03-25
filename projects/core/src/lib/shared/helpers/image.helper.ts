import { Observable, of, Subject } from 'rxjs';
import { Byte, Charset, Encoder } from '@nuintun/qrcode';

export class ImageHelper {
  public static imageUrlToPng$(imageUrl: string): Observable<{ imageData: string; width: number; height: number }> {
    const subject = new Subject<{ imageData: string; width: number; height: number }>();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx === null) {
      subject.error('Canvas context is null');
      subject.complete();
    } else {
      const img = document.createElement('img');
      img.crossOrigin = 'anonymous';
      img.addEventListener('load', () => {
        try {
          // some svg images do not have width/height specified
          const width = img.width === 0 && imageUrl.endsWith('.svg') ? 500 : img.width;
          const height = img.height === 0 && imageUrl.endsWith('.svg') ? 500 : img.height;
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);
          const imageData = canvas.toDataURL('image/png');
          subject.next({ imageData, width, height });
        } catch (e) {
          subject.error(e);
        }
        subject.complete();
      });
      img.addEventListener('error', (e) => {
        subject.error(e);
        subject.complete();
      });
      img.setAttribute('src', imageUrl);
    }
    return subject.asObservable();
  }

  public static string2Base64QRcode$(asciiData: string, foreground: string, background: string): Observable<{
    imageData: string;
    widthPx: number;
    heightPx: number;
  }> {
    const encoder = new Encoder({
      level: 'M', version: 'Auto', hints: { fnc1: ['GS1'] },
    });
    const qrcode = encoder.encode(new Byte(asciiData, Charset.ASCII));

    return of({
      imageData: qrcode.toDataURL(1, {
        margin: 1, foreground: this.hex2rgb(foreground), background: this.hex2rgb(background),
      }), widthPx: qrcode.size, heightPx: qrcode.size,
    });
  }

  private static hex2rgb(hex: string): [R: number, G: number, B: number] {
    const value = parseInt(hex.slice(1, 7), 16);
    return [ (value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff ];
  }
}
