import { BehaviorSubject, filter } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

export class MapCursorHelper {

  private static CROSSHAIR_CLASS = 'map-container--with-crosshair';

  private static listening = false;
  private static debounceList = new BehaviorSubject<boolean[]>([]);

  private static registerListener() {
    if (!MapCursorHelper.listening) {
      MapCursorHelper.debounceList.asObservable()
        .pipe(
          debounceTime(10),
          filter(list => list.length > 0),
        )
        .subscribe(result => {
          MapCursorHelper.setCursorClass(result.some(r => r));
          MapCursorHelper.debounceList.next([]);
        });
    }
  }

  public static setCrosshairCursor(enabled: boolean) {
    MapCursorHelper.registerListener();
    MapCursorHelper.debounceList.next([ ...MapCursorHelper.debounceList.value, enabled ]);
  }

  private static setCursorClass(enabled: boolean) {
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
