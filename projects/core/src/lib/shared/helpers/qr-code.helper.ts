import { from, map, Observable } from 'rxjs';

export class QrCodeHelper {
  /**
   * Convert a string to a base64 encoded QR code image.
   * This can be used to create QR codes for any text dat, the size of the QR image is set automatically,
   * the amount of redundancy is set to 'M', this means you can have about 2331 bytes of data and allows for about 15% loss recovery,
   * assuming the `asciiData` string is ISO/IEC 8859-1 encoded. The larger the input the larger the generated image.
   *
   * @param asciiData The data to encode in the QR code
   * @param foreground The color of the QR code
   * @param background The background color of the QR code
   * @param minimumOutputWidthPx Optional minimum width for the generated QR code image in pixels
   * @returns An observable that emits the base64 encoded QR code GIF image and the size of the image
   */
  public static string2Base64QRcode$(
    asciiData: string,
    foreground: string,
    background: string,
    minimumOutputWidthPx = 0,
  ): Observable<{ imageData: string; widthPx: number; heightPx: number }> {

    return from(import('@nuintun/qrcode')).pipe(map(({ Encoder, Byte, Charset }) => {
      const encoder = new Encoder({
        level: 'M', version: 'Auto', hints: { fnc1: ['GS1'] },
      });
      const qrcode = encoder.encode(new Byte(asciiData, Charset.ASCII));
      const scale = Math.max(1, Math.ceil(minimumOutputWidthPx / qrcode.size));
      const imageSizePx = qrcode.size * scale;

      return {
        imageData: qrcode.toDataURL(scale, {
          margin: 1, foreground: this.hex2rgb(foreground), background: this.hex2rgb(background),
        }),
        widthPx: imageSizePx,
        heightPx: imageSizePx,
      };
    }));
  }

  private static hex2rgb(hex: string): [R: number, G: number, B: number] {
    const value = parseInt(hex.slice(1, 7), 16);
    return [ (value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff ];
  }
}
