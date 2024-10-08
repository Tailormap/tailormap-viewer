import { parse } from '@tinyhttp/content-disposition';

export class FileHelper {

  public static saveAsFile(data: object | Blob, filename: string) {
    const a = document.createElement('a');
    const file = FileHelper.getData(data);
    a.href = URL.createObjectURL(file);
    a.style.display = 'none';
    a.setAttribute('download', filename);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  }

  public static extractFileNameFromContentDispositionHeader(contentDispositionHeader: string, defaultName = 'file') {
    if(contentDispositionHeader === null) {
      return defaultName;
    }
    try {
      return parse(contentDispositionHeader).parameters['filename'] as string || defaultName;
    } catch(_ignored) {
      return defaultName;
    }
  }

  private static getData(data: object | Blob) {
    if (data instanceof Blob) {
      return data;
    }
    try {
      const jsonData = JSON.stringify(data);
      new Blob([jsonData], { type: 'application/json' });
    } catch (e) {
      // ignore error
    }
    return new Blob([], { type: 'application/json' });
  }

}
