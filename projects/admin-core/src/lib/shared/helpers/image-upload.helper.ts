import { concatMap, map, Observable, of, Subject } from 'rxjs';
import { FileHelper } from '@tailormap-viewer/shared';

export interface ImageResult {
  error?: string;
  image?: string;
  fileName?: string;
}

export class ImageUploadHelper {

  public static readFileAsImage$(file: File, maxSize = 2, resizeSize: number | null = null, restrictTypes?: string[] | null): Observable<ImageResult | null> {

    const errorMsg = ImageUploadHelper.checkSizeAndType(file, maxSize, resizeSize, restrictTypes);
    if (errorMsg.length > 0) {
      return of({ error: errorMsg.join('. ') });
    }
    const fileName = file.name;
    return ImageUploadHelper.readUploadAsImage$(file, resizeSize)
      .pipe(map(image => {
        if (image !== null) {
          return { image, fileName };
        }
        return {};
      }));
  }

  public static checkSizeAndType(file: File, maxSize = 2, resizeSize: number | null = null, restrictTypes?: string[] | null): string[] {
    const result = [];
    const isOversizeLimit = file.size > (maxSize * 1000 * 1000);
    const isRasterImage = ImageUploadHelper.isRasterImage(file);
    // When image will be resized it will end up below the size limit if the resizeSize is small enough
    const canResizeImage = isRasterImage && resizeSize !== null;
    if (isOversizeLimit && !canResizeImage) {
      result.push('Maximum size allowed is ' + maxSize + 'MB');
    }
    try {
      ImageUploadHelper.assertValidImageFile(file, restrictTypes);
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
    if (!restrictTypes.some((allowed) => ImageUploadHelper.mimeMatchesAllowed(mime, allowed))) {
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

  private static isRasterImage(file: File | Blob) {
    return /jpeg|jpg|png/.test(file.type);
  }

  private static readUploadAsImage$(file: File | Blob, resizeSize: number | null = null): Observable<string | null> {
    return FileHelper.readFileContents(file).pipe(
      concatMap(fileContents => {
        if (fileContents === null) {
          return of(null);
        }
        const resizedImageBase64 = new Subject<string | null>();
        const image = new Image();
        image.src = fileContents.dataURL;
        image.onload = (_) => {
          if (ImageUploadHelper.isRasterImage(file) && resizeSize !== null) {
            const resizedImage = ImageUploadHelper.getResizedImage(image, file.type, resizeSize);
            resizedImageBase64.next(resizedImage);
            resizedImageBase64.complete();
            return;
          } else {
            resizedImageBase64.next(fileContents.dataURL);
            resizedImageBase64.complete();
          }
        };
        image.onerror = () => {
          resizedImageBase64.next(null);
          resizedImageBase64.complete();
        };

        return resizedImageBase64.asObservable();
      }),
    );
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
}
