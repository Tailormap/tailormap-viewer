export class UploadedImageHelper {
  public static getUrlForFile(id: string, category: string, fileName: string = 't') {
    return `/api/uploads/${category}/${id}/${fileName}`;
  }

  public static getAdminUrlForLegend(id: string, category: string, fileName: string = 't') {
    return `/api/admin/uploads/${category}/${id}/${fileName}`;
  }

}
