import { BehaviorSubject, Observable, of } from 'rxjs';

export class ExternalLibsLoaderHelper {

  private static baseHref: string = '';
  private static loadedScripts = new Map<string, BehaviorSubject<boolean>>();

  public static setBaseHref(baseHref: string) {
    ExternalLibsLoaderHelper.baseHref = baseHref;
  }

  public static loadScript$(url: string): Observable<boolean> {
    const scriptUrl = ExternalLibsLoaderHelper.baseHref + url;
    const current = ExternalLibsLoaderHelper.loadedScripts.get(url);
    if (current) {
      return current.asObservable();
    }
    const ext: string = url.split('.').reverse().shift() || '';
    if (ext === '') {
      return of(false);
    }
    const loaderSubject = new BehaviorSubject(false);
    ExternalLibsLoaderHelper.loadedScripts.set(scriptUrl, ExternalLibsLoaderHelper.addTag(ext, scriptUrl, loaderSubject));
    return loaderSubject.asObservable();
  }

  private static addTag(ext: string, url: string, loaderSubject: BehaviorSubject<boolean>) {
    if (ext === 'js') {
      const script: HTMLScriptElement = document.createElement('script');
      script.type = 'text/javascript';
      script.src = url;
      script.async = true;
      script.onload = () => loaderSubject.next(true);
      document.body.appendChild(script);
    }
    if (ext === 'css') {
      const link: HTMLLinkElement = document.createElement('link');
      link.href = url;
      link.type = 'text/css';
      link.rel  = 'stylesheet';
      link.onload = () => loaderSubject.next(true);
      const head: HTMLHeadElement = document.getElementsByTagName('head')[0];
      head.appendChild(link);
    }
    return loaderSubject;
  }

}
