import { ChangeDetectionStrategy, Component, input, signal, output } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatButton } from '@angular/material/button';
import { FileContents, FileHelper, TooltipDirective } from '@tailormap-viewer/shared';

@Component({
  selector: 'tm-file-upload-field',
  templateUrl: './file-upload-field.component.html',
  styleUrls: ['./file-upload-field.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ MatIcon, MatButton, TooltipDirective ],
})
export class FileUploadFieldComponent {
  public acceptedFileTypes = input<string[]>(['*/*']);
  public isFileSelected = signal(false);

  public fileChanged = output<FileContents | null>();

  public fileChangeEvent($event: Event) {
    if (!$event.target || !($event.target instanceof HTMLInputElement)) {
      return;
    }
    const fileInput: HTMLInputElement = $event.target;
    if (!fileInput.files || fileInput.files.length === 0) {
      return;
    }
    const file = fileInput.files[0];
    FileHelper.readFileContents(file).subscribe(contents => {
      this.isFileSelected.set(contents !== null);
      this.fileChanged.emit(contents);
    });
  }

  public emitClear() {
    this.fileChanged.emit(null);
  }
}
