import { ChangeDetectionStrategy, Component, EventEmitter, inject, Input, LOCALE_ID, Output } from '@angular/core';
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

  @Input({ required: true })
  public set attachmentAttributes(attachmentAttributes: AttachmentAttributeModel[] | undefined) {
    this._attachmentAttributes = attachmentAttributes || [];
  }
  public get attachmentAttributes(): AttachmentAttributeModel[] {
    return this._attachmentAttributes;
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

  public getMaxSizeExceededTooltip(attribute: AttachmentAttributeModel, attachment: File) {
    const maxSizeMB = new Intl.NumberFormat(this.locale, { maximumFractionDigits: 1 }).format(attribute.maxAttachmentSize! / (1024 * 1024));
    const fileSizeMB = new Intl.NumberFormat(this.locale, { maximumFractionDigits: 1 }).format(attachment.size / (1024 * 1024));
    return $localize`:@@core.edit.attachment.tooltip.max-size-exceeded:File size (${fileSizeMB} MB) exceeds maximum allowed size of ${maxSizeMB} MB`;
  }
}
