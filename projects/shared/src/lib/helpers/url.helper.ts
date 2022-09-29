export class UrlHelper {

  public static getUrlSafeParam(param: string): string {
    return encodeURIComponent(param).replace(/%20/g, '+');
  }

  public static filterUrlParameters(
    urlString: string,
    filterFunction: (paramName: string, paramValue: string) => boolean,
  ): string {
    const url = new URL(urlString);
    const paramsToDelete: string[] = [];
    url.searchParams.forEach((value, key) => {
      if (!filterFunction(key, value)) {
        paramsToDelete.push(key);
      }
    });
    paramsToDelete.forEach(p => url.searchParams.delete(p));
    return url.href;
  }

  public static getParamCaseInsensitive(url: URL, param: string): string | null {
    param = param.toLowerCase();
    let result = null;
    url.searchParams.forEach((value, key) => {
      if(key.toLowerCase() === param) {
        result = value;
      }
    });
    return result;
  }
}
