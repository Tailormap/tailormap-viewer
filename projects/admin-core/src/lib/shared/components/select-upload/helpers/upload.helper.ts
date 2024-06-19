export class UploadHelper {

  public static getUrlForFile(id: string, category: string, fileName: string = 't') {
    return `/api/uploads/${category}/${id}/${fileName}`;
  }

}
