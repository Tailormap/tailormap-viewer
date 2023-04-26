export class StringHelper {
  public static isNotBlank(s: string | null | undefined) {
    return typeof s === 'string' && s.trim().length > 0;
  }
}
