export class UploadedFileHelper {
  public static getUrlForFile(id: string, category: string, fileName: string = 't') {
    return `/api/uploads/${category}/${id}/${fileName}`;
  }

  public static getAdminUrlForFile(id: string, category: string, fileName: string = 't') {
    return `/api/admin/uploads/download/${category}/${id}/${fileName}`;
  }

}
