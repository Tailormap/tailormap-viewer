export class MapCursorHelper {

  private static CROSSHAIR_CLASS = 'map-container--with-crosshair';

  public static setCrosshairCursor(enabled: boolean) {
    const el = document.querySelector('.map-container');
    if (!el) {
      return;
    }
    if (enabled) {
      el.classList.add(MapCursorHelper.CROSSHAIR_CLASS);
    } else {
      el.classList.remove(MapCursorHelper.CROSSHAIR_CLASS);
    }
  }

}
