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

  public static extractFileNameFromContentDispositionHeader(contentDisposition: string, defaultName = 'file') {
    const separator = contentDisposition.indexOf('filename=') !== -1
      ? 'filename'
      : null;
    if (separator === null) {
      return defaultName;
    }
    const utf8FilenameRegex = /filename\*=UTF-8''([\w%\-.]+)(?:; ?|$)/i;
    const asciiFilenameRegex = /filename=(["']?)(.*?[^\\])\1(?:; ?|$)/i;
    if (utf8FilenameRegex.test(contentDisposition)) {
      const matches = utf8FilenameRegex.exec(contentDisposition);
      if (matches != null && matches[1]) {
        return decodeURIComponent(matches[1]);
      }
    }
    if (asciiFilenameRegex.test(contentDisposition)) {
      const matches = asciiFilenameRegex.exec(contentDisposition);
      if (matches != null && matches[2]) {
        return matches[2];
      }
    }
    return defaultName;
  }

  private static getData(data: object | Blob) {
    if (data instanceof Blob) {
      return data;
    }
    try {
      const jsonData = JSON.stringify(data);
      new Blob([jsonData], { type: 'application/json' });
    } catch (e) {}
    return new Blob([], { type: 'application/json' });
  }

}
