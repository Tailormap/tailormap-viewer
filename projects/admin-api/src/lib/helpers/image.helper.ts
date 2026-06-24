import { map, Observable, of, Subject } from 'rxjs';
import { UploadHelper } from './upload.helper';

export interface ImageResult {
  error?: string;
  image?: string;
  fileName?: string;
}

export class ImageHelper {

  public static readFileAsImage$(file: File, maxSize = 2, resizeSize = 600, restrictTypes?: string[] | null): Observable<ImageResult | null> {

    const errorMsg = ImageHelper.checkSizeAndType(file, maxSize, restrictTypes);
    if (errorMsg.length > 0) {
      return of({ error: errorMsg.join('. ') });
    }
    const fileName = file.name;
    return ImageHelper.readUploadAsImage$(file, resizeSize)
      .pipe(map(image => {
        if (image !== null) {
          return { image, fileName };
        }
        return {};
      }));
  }

  public static checkSizeAndType(file: File, maxSize = 2, restrictTypes?: string[] | null): string[] {
    const result = [];
    if (!ImageHelper.isResizableImage(file) && file.size > (maxSize * 1000 * 1000)) {
      result.push('Maximum size allowed is ' + maxSize + 'MB');
    }
    try {
      ImageHelper.assertValidImageFile(file, restrictTypes);
    } catch (error: any) {
      result.push(error.message);
    }
    return result;
  }

  public static assertValidImageFile(file: File, restrictTypes?: string[] | null): boolean {
    const mime = file.type;
    if (!mime.startsWith('image/')) {
      throw new Error('Only images are allowed.');
    }
    if (!restrictTypes || restrictTypes.length === 0) {
      return true;
    }
    if (!restrictTypes.some((allowed) => ImageHelper.mimeMatchesAllowed(mime, allowed))) {
      throw new Error(`Only images of type ${restrictTypes.join(', ')} are allowed.`);
    }
    return true;
  }

  private static mimeMatchesAllowed(mime: string, allowed: string): boolean {
    if (allowed === mime) return true;

    if (allowed.endsWith('/*')) {
      const allowedGroup = allowed.slice(0, -2); // e.g. 'image'
      const [mimeGroup] = mime.split('/');
      return mimeGroup === allowedGroup;
    }

    return false;
  }

  public static isResizableImage(file: File | Blob) {
    return /jpeg|jpg|png/.test(file.type);
  }

  public static readUploadAsImage$(file: File | Blob, resizeSize = 600): Observable<string | null> {
    const subject = new Subject<string | null>();
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      if (!e.target) {
        subject.next(null);
        subject.complete();
        return;
      }
      const result = e.target.result instanceof ArrayBuffer
        ? ImageHelper.bufferToBase64(e.target.result)
        : e.target.result;
      if (!result) {
        subject.next(null);
        subject.complete();
        return;
      }
      const image = new Image();
      image.src = result;
      image.onload = (_) => {
        if (ImageHelper.isResizableImage(file)) {
          const resizedImage = ImageHelper.getResizedImage(image, file.type, resizeSize);
          subject.next(resizedImage);
          subject.complete();
          return;
        }
        subject.next(result);
        subject.complete();
      };
      image.onerror = () => {
        subject.next(null);
        subject.complete();
      };
    };
    reader.readAsDataURL(file);
    return subject.asObservable();
  }

  private static getResizedImage(image: HTMLImageElement, imageMime: string, resizeSize: number) {
    const MAX_WIDTH = resizeSize;
    const MAX_HEIGHT = resizeSize;

    let width = image.width;
    let height = image.height;

    if (width < MAX_WIDTH && height < MAX_HEIGHT) {
      return image.src;
    }

    if (width > height) {
      if (width > MAX_WIDTH) {
        height = height * (MAX_WIDTH / width);
        width = MAX_WIDTH;
      }
    } else {
      if (height > MAX_HEIGHT) {
        width = width * (MAX_HEIGHT / height);
        height = MAX_HEIGHT;
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return null;
    }
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(image, 0, 0, width, height);
    return canvas.toDataURL(imageMime);
  }

  private static bufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode( bytes[ i ] );
    }
    return window.btoa( binary );
  }

}
