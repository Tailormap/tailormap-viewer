import { Observable, Subject } from 'rxjs';

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
}
