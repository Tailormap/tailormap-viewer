import { AttachmentAttributeModel, AttachmentMetadataModel } from '@tailormap-viewer/api';
import { formatDate } from '@angular/common';
import { inject, Injectable, LOCALE_ID } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AttachmentHelper {
  private locale = inject(LOCALE_ID);

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
}
