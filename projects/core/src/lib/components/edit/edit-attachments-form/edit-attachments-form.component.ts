import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { AttachmentAttributeModel, AttachmentMetadataModel } from '@tailormap-viewer/api';
import { EditFormInput } from '../models/edit-form-input.model';

@Component({
  selector: 'tm-edit-attachments-form',
  templateUrl: './edit-attachments-form.component.html',
  styleUrls: ['./edit-attachments-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class EditAttachmentsFormComponent {
  private _feature: EditFormInput | undefined;

  public attachmentAttributes: AttachmentAttributeModel[] = [];

  @Input({ required: true })
  public set feature(feature: EditFormInput | undefined) {
    this._feature = feature;
    this.attachmentAttributes = feature?.details?.attachmentAttributes || [];
  }
  public get feature(): EditFormInput | undefined {
    return this._feature;
  }

  @Input()
  public attachmentsByAttributeName: Map<string, Array<AttachmentMetadataModel & { url: string}>> | null = null;

  @Input()
  public newAttachmentsByAttributeName: Map<string, File[]> = new Map();

  @Output()
  public newAttachmentsChanged = new EventEmitter<{ attribute: string; files: File[] }>();

  @Output()
  public deletedAttachmentsChanged = new EventEmitter<Set<string>>();

  public deletedAttachments = new Set<string>();

  public onFileChange(attribute: string, $event: Event) {
    const target = $event.target as HTMLInputElement;
    this.newAttachmentsChanged.emit({ attribute, files: target.files ? Array.from(target.files) : [] });
  }

  public onRemoveNewAttachment(fileList: File[], attribute: string, attachmentName: string) {
    const newFileList = fileList.filter(file => file.name !== attachmentName);
    this.newAttachmentsChanged.emit({ attribute, files: newFileList });
  }

  public onDeleteAttachment(attachmentId: string) {
    if (this.deletedAttachments.has(attachmentId)) {
      this.deletedAttachments.delete(attachmentId);
    } else {
      this.deletedAttachments.add(attachmentId);
    }
    this.deletedAttachmentsChanged.emit(this.deletedAttachments);
  }
}
