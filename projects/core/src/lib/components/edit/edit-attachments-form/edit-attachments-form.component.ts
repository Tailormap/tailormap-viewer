import {
  ChangeDetectionStrategy, Component, EventEmitter, inject, Input, Output, ViewChildren, QueryList, ElementRef,
} from '@angular/core';
import { AttachmentAttributeModel, AttachmentMetadataModel } from '@tailormap-viewer/api';
import { AttachmentService } from '../../../services/attachment.service';

@Component({
  selector: 'tm-edit-attachments-form',
  templateUrl: './edit-attachments-form.component.html',
  styleUrls: ['./edit-attachments-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class EditAttachmentsFormComponent {
  public attachmentHelper = inject(AttachmentService);

  public _attachmentAttributes: AttachmentAttributeModel[] = [];

  @ViewChildren('fileInput')
  private fileInputs?: QueryList<ElementRef<HTMLInputElement>>;

  @Input({ required: true })
  public set attachmentAttributes(attachmentAttributes: AttachmentAttributeModel[] | undefined) {
    this._attachmentAttributes = attachmentAttributes || [];

  }
  public get attachmentAttributes(): AttachmentAttributeModel[] {
    return this._attachmentAttributes;
  }

  private _attachmentsByAttributeName: Map<string, Array<AttachmentMetadataModel & { url: string }>> | null = null;

  @Input()
  public set attachmentsByAttributeName(value: Map<string, Array<AttachmentMetadataModel & { url: string }>> | null) {
    this._attachmentsByAttributeName = value;
  }

  public get attachmentsByAttributeName(): Map<string, Array<AttachmentMetadataModel & { url: string }>> | null {
    return this._attachmentsByAttributeName;
  }

  @Input()
  public loadingAttachments = false;

  @Input()
  public newAttachmentsByAttributeName: Map<string, File[]> = new Map();

  @Output()
  public newAttachmentsChanged = new EventEmitter<Map<string, File[]>>();

  @Output()
  public deletedAttachmentsChanged = new EventEmitter<Set<string>>();

  public deletedAttachments = new Set<string>();

  private resetFileInputValues() {
    if (this.fileInputs) {
      this.fileInputs.forEach(input => input.nativeElement.value = '');
    }
  }

  public onFileChange(attribute: string, $event: Event) {
    const target = $event.target as HTMLInputElement;
    const files = [
      ...this.newAttachmentsByAttributeName.get(attribute) || [],
      ...(target.files ? Array.from(target.files) : []),
    ];
    this.newAttachmentsByAttributeName.set(attribute, files);
    this.newAttachmentsChanged.emit(this.newAttachmentsByAttributeName);
    this.resetFileInputValues();
  }

  public onDeleteAttachment(attachmentId: string) {
    if (this.deletedAttachments.has(attachmentId)) {
      this.deletedAttachments.delete(attachmentId);
    } else {
      this.deletedAttachments.add(attachmentId);
    }
    this.deletedAttachmentsChanged.emit(this.deletedAttachments);
  }

  public onRemoveNewAttachment(attribute: AttachmentAttributeModel, attachment: File) {
    const files = this.newAttachmentsByAttributeName.get(attribute.attributeName)!.filter(f => f !== attachment);
    this.newAttachmentsByAttributeName.set(attribute.attributeName, files);
    this.newAttachmentsChanged.emit(this.newAttachmentsByAttributeName);
  }
}
