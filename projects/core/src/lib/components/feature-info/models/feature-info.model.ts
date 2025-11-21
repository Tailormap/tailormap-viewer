import { AppLayerModel, AttachmentMetadataModel } from '@tailormap-viewer/api';

export interface FeatureInfoModel {
  __fid: string;
  layer: AppLayerModel;
  sortedAttributes: Array<{ label: string; attributeValue: any; key: string }>;
  sortedAttachmentsByAttribute: Array<{ attributeName: string; attachments: AttachmentMetadataModel[] }>;
  attachmentCount: number;
  geometry: string | null;
}
