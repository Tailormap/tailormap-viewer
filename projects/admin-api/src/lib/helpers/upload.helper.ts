export class UploadHelper {

  public static getUrlForFile(id: string, category: string, fileName: string = 't') {
    return `/api/uploads/${category}/${id}/${fileName}`;
  }

  public static prepareBase64(image: string) {
    const dataIdx = image.indexOf('data:');
    const base64Idx = image.indexOf(';base64,');
    let mimeType: string | undefined = undefined;
    if (dataIdx === 0 && base64Idx !== -1) {
      mimeType = image.substring(dataIdx + 5, base64Idx);
      image = image.substring(base64Idx + 8);
    }
    return { image, mimeType };
  }

}
