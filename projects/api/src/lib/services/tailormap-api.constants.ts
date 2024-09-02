export class TailormapApiConstants {
  public static BASE_URL = '/api';
  public static LOGIN_URL = `${TailormapApiConstants.BASE_URL}/login`;
  public static LOGOUT_URL = `${TailormapApiConstants.BASE_URL}/logout`;
  public static XSRF_COOKIE_NAME = 'XSRF-TOKEN';
  public static XSRF_HEADER_NAME = 'X-XSRF-TOKEN';
}
