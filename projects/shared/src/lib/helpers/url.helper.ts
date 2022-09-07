export class UrlHelper {

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
    for(const entry of url.searchParams.entries()) {
      if(entry[0].toLowerCase() === param) {
        return entry[1];
      }
    }
    return null;
  }
}
