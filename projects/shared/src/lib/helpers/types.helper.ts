export class TypesHelper {

  public static isDefined<T>(arg: T | null | undefined): arg is T {
    return arg !== null && typeof arg !== 'undefined';
  }

}
