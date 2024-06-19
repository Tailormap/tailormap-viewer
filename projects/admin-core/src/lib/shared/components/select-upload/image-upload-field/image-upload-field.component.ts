import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';
import { ImageHelper } from '../../../../helpers/image.helper';

@Component({
  selector: 'tm-image-upload-field',
  templateUrl: './image-upload-field.component.html',
  styleUrls: ['./image-upload-field.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageUploadFieldComponent {

  public isImageSaved = false;
  public isImageRemoved = false;
  public imageContent: string | null = null;
  public imageError: string | null = null;

  @Input()
  public currentImage: string | null | undefined;

  @Input()
  public maxSize = 2;

  @Input()
  public resizeSize = 600;

  @Output()
  public imageChanged = new EventEmitter<{ image: string; fileName: string }>();

  constructor(
    private cdr: ChangeDetectorRef,
  ) {}

  public fileChangeEvent($event: Event) {
    this.imageError = null;
    if (!$event.target || !($event.target instanceof HTMLInputElement)) {
      return;
    }
    const fileInput: HTMLInputElement = $event.target;
    if (!fileInput.files || fileInput.files.length === 0) {
      return;
    }
    const errorMsg = ImageHelper.checkSizeAndType(fileInput.files[0], this.maxSize);
    if (errorMsg.length > 0) {
      this.imageError = errorMsg.join('. ');
      return;
    }
    const fileName = fileInput.files[0].name;
    ImageHelper.readUploadAsImage$(fileInput.files[0], this.resizeSize)
      .subscribe(image => {
        if (image !== null) {
          this.updateValue(image, fileName);
        }
      });
  }

  private updateValue(image: string, fileName: string) {
    this.imageContent = image ? image : null;
    this.isImageSaved = !!image;
    this.isImageRemoved = !image;
    this.imageChanged.emit({ image, fileName });
    this.cdr.detectChanges();
  }

  public clearImage() {
    this.updateValue('', '');
  }

}
