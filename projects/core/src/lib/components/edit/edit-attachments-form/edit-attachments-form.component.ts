import {
  ChangeDetectionStrategy, Component, EventEmitter, inject, Input, LOCALE_ID, Output, ViewChildren, QueryList, ElementRef,
} from '@angular/core';
import { AttachmentAttributeModel, AttachmentMetadataModel } from '@tailormap-viewer/api';
import { formatDate } from '@angular/common';

@Component({
  selector: 'tm-edit-attachments-form',
  templateUrl: './edit-attachments-form.component.html',
  styleUrls: ['./edit-attachments-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class EditAttachmentsFormComponent {
  private locale = inject(LOCALE_ID);

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

  public getAttachmentTooltip(attachment: AttachmentMetadataModel) {
    const createdAt = formatDate(attachment.createdAt, 'short', this.locale);
    let tooltip = $localize`:@@core.edit.attachment.tooltip.added-on-by:Added on ${createdAt} by ${attachment.createdBy}`;
    const sizeKB = new Intl.NumberFormat(this.locale, { maximumFractionDigits: 1 }).format(attachment.attachmentSize / 1024);
    tooltip += '\n' + $localize`:@@core.edit.attachment.tooltip.size:Size: ${sizeKB} KB`;
    if (attachment.description) {
      tooltip += '\n' + $localize`:@@core.edit.attachment.tooltip.description:Description: ${attachment.description}`;
    }
    return tooltip;
  }

  public getNewAttachmentTooltip(attribute: AttachmentAttributeModel, file: File, sizeExceeded: boolean) {
    if (sizeExceeded) {
      const maxSizeMB = new Intl.NumberFormat(this.locale, { maximumFractionDigits: 1 }).format(attribute.maxAttachmentSize! / (1024 * 1024));
      const fileSizeMB = new Intl.NumberFormat(this.locale, { maximumFractionDigits: 1 }).format(file.size / (1024 * 1024));
      return $localize`:@@core.edit.attachment.tooltip.max-size-exceeded:File size (${fileSizeMB} MB) exceeds maximum allowed size of ${maxSizeMB} MB`;
    } else {
      const fileSizeKB = new Intl.NumberFormat(this.locale, { maximumFractionDigits: 1 }).format(file.size / 1024);
      return `${file.name} (${fileSizeKB} KB)`;
    }
  }

  public onRemoveNewAttachment(attribute: AttachmentAttributeModel, attachment: File) {
    const files = this.newAttachmentsByAttributeName.get(attribute.attributeName)!.filter(f => f !== attachment);
    this.newAttachmentsByAttributeName.set(attribute.attributeName, files);
    this.newAttachmentsChanged.emit(this.newAttachmentsByAttributeName);
  }
}
