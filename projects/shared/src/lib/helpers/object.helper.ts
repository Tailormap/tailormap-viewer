export class ObjectHelper {

  public static hasProperties(obj: {[key: string]: any}, properties: string[]): boolean {
    return properties.every(prop => Object.prototype.hasOwnProperty.call(obj, prop));
  }

}
