import { Observable, Subject } from 'rxjs';

export class ImageHelper {

  public static checkSizeAndType(file: File, maxSize = 2): string[] {
    const result = [];
    if (!ImageHelper.isResizableImage(file) && file.size > (maxSize * 1000 * 1000)) {
      result.push('Maximum size allowed is ' + maxSize + 'MB');
    }
    if (!(/image\//.test(file.type))) {
      result.push('Only images are allowed.');
    }
    return result;
  }

  public static isResizableImage(file: File) {
    return /jpeg|jpg|png/.test(file.type);
  }

  public static readUploadAsImage$(file: File, resizeSize = 600): Observable<string | null> {
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
