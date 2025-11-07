export interface AttachmentMetadataModel {
  attachmentId: string;
  attachmentSize: number;
  attributeName: string;
  createdAt: string;
  createdBy: string;
  description: string | null;
  fileName: string;
  mimeType: string;
}
