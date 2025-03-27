import { from, map, Observable, Subject } from 'rxjs';

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

  /**
   * Convert a string to a base64 encoded QR code image.
   * This can be used to create QR codes for any text dat, the size of the QR image is set automatically,
   * the amount of redundancy is set to 'M', this means you can have about 2331 bytes of data and allows for about 15% loss recovery,
   * assuming the `asciiData` string is ISO/IEC 8859-1 encoded. The larger the input the larger the generated image.
   *
   * @param asciiData The data to encode in the QR code
   * @param foreground The color of the QR code
   * @param background The background color of the QR code
   * @returns An observable that emits the base64 encoded QR code GIF image and the size of the image
   */
  public static string2Base64QRcode$(asciiData: string, foreground: string, background: string): Observable<{
    imageData: string; widthPx: number; heightPx: number;
  }> {

    return from(import('@nuintun/qrcode')).pipe(map(({ Encoder, Byte, Charset }) => {
      const encoder = new Encoder({
        level: 'M', version: 'Auto', hints: { fnc1: ['GS1'] },
      });
      const qrcode = encoder.encode(new Byte(asciiData, Charset.ASCII));

      return {
        imageData: qrcode.toDataURL(1, {
          margin: 1, foreground: this.hex2rgb(foreground), background: this.hex2rgb(background),
        }), widthPx: qrcode.size, heightPx: qrcode.size,
      };
    }));
  }

  private static hex2rgb(hex: string): [R: number, G: number, B: number] {
    const value = parseInt(hex.slice(1, 7), 16);
    return [ (value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff ];
  }
}
