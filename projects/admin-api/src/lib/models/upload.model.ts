export interface UploadModel {
  id: string;
  filename: string;
  category: string;
  mimeType: string | undefined | null;
  imageWidth: number | undefined | null;
  imageHeight: number | undefined | null;
  hiDpiImage: boolean | undefined | null;
  imageAltText: string | undefined | null;
  lastModified: string | Date;
  content?: string;
  contentLength: number | null;
  contentSize?: string;
}
