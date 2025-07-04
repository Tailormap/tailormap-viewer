export class UploadedImageHelper {
  public static readonly DRAWING_STYLE_CATEGORY = 'drawing-style';
  public static readonly DRAWING_STYLE_IMAGE_CATEGORY = 'drawing-style-image';
  public static getUrlForFile(id: string, category: string, fileName: string = 't') {
    return `/api/uploads/${category}/${id}/${fileName}`;
  }
}
