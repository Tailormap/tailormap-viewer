import * as proj4 from 'proj4';

export class Proj4Helper {
  // This hack is needed because the module import is different in node and browser environments
  // When running in Jest, proj4 itself is the default export, in browser the proj4 method is in the default property
  public static get proj4(): typeof proj4 {
    try {
      if ((proj4 as any).default) {
        return (proj4 as any).default as typeof proj4;
      }
      return proj4;
    } catch (e) {
      return proj4;
    }
  }
}
