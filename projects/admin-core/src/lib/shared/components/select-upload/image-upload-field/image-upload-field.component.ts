import { ChangeDetectionStrategy, Component, input, signal, output } from '@angular/core';
import { ImageHelper } from '@tailormap-admin/admin-api';

@Component({
  selector: 'tm-image-upload-field',
  templateUrl: './image-upload-field.component.html',
  styleUrls: ['./image-upload-field.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ImageUploadFieldComponent {
  public isImageSaved = signal(false);
  public isImageRemoved = signal(false);
  public imageContent = signal<string | null>(null);
  public imageError = signal<string | null>(null);

  public currentImage = input<string | null | undefined>();
  public maxSize  = input(2);
  public resizeSize  = input(600);
  public acceptedImageTypes = input<string[]>(['image/*']);
  public emitRawImage = input<boolean>(false);

  public imageChanged = output<{ image: string; fileName: string }>();
  public rawImageChanged = output<{ image: File; fileName: string }>();

  public fileChangeEvent($event: Event) {
    this.imageError.set(null);
    if (!$event.target || !($event.target instanceof HTMLInputElement)) {
      return;
    }
    const fileInput: HTMLInputElement = $event.target;
    if (!fileInput.files || fileInput.files.length === 0) {
      return;
    }
    if (this.emitRawImage()) {
      const errorMsg = ImageHelper.checkSizeAndType(fileInput.files[0], this.maxSize(), this.acceptedImageTypes());
      if (errorMsg.length > 0) {
        this.imageError.set(errorMsg.join('. '));
        return;
      }
    }
    ImageHelper.readFileAsImage$(fileInput.files[0], this.maxSize(), this.resizeSize(), this.acceptedImageTypes())
      .subscribe(result => {
        if (result?.error) {
          this.imageError.set(result.error);
        }
        if (result?.image && result?.fileName) {
          this.updateValue(result.image, result.fileName);
        }
      });
  }

  private updateValue(image: string, fileName: string) {
    this.imageContent.set(image ? image : null);
    this.isImageSaved.set(!!image);
    this.isImageRemoved.set(!image);
    this.imageChanged.emit({ image, fileName });
  }

  public clearImage() {
    this.updateValue('', '');
  }

}
