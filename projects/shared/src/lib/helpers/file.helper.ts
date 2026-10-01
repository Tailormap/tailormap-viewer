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
    } catch (_ignored) {
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

  public static byteCountToDisplaySize(sizeBytes: number | bigint | null | undefined): string {
    // https://stackoverflow.com/a/72596863
    if (sizeBytes === null || typeof sizeBytes === 'undefined') {
      return '';
    }
    const UNITS = [ 'byte', 'kilobyte', 'megabyte', 'gigabyte', 'terabyte', 'petabyte' ];
    const BYTES_PER_KB = 1000;
    let size = Math.abs(Number(sizeBytes));
    let u = 0;
    while(size >= BYTES_PER_KB && u < UNITS.length-1) {
      size /= BYTES_PER_KB;
      ++u;
    }
    return new Intl.NumberFormat([], { style: 'unit', unit: UNITS[u], unitDisplay: 'short', maximumFractionDigits: 1 })
      .format(size);
  }
}
