import { from, map, Observable, switchMap } from 'rxjs';
import { UploadedFileHelper } from '@tailormap-viewer/api';

export class UploadHelper {

  public static getUrlForFile(id: string, category: string, fileName: string = 't') {
    return UploadedFileHelper.getUrlForFile(id, category, fileName);
  }

  public static getAdminUrlForFile(id: string, category: string, fileName: string = 't') {
    return UploadedFileHelper.getAdminUrlForFile(id, category, fileName);
  }
}
