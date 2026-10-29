import { BehaviorSubject, filter } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

export class MapCursorHelper {

  private static CROSSHAIR_CLASS = 'map-container--with-crosshair';
  private static COPY_CLASS = 'map-container--with-copy-cursor';

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
          MapCursorHelper.setCursorClass(MapCursorHelper.CROSSHAIR_CLASS, result.some(r => r));
          MapCursorHelper.debounceList.next([]);
        });
    }
  }

  public static setCrosshairCursor(enabled: boolean) {
    MapCursorHelper.registerListener();
    MapCursorHelper.debounceList.next([ ...MapCursorHelper.debounceList.value, enabled ]);
  }

  public static setCopyCursor(enabled: boolean) {
    MapCursorHelper.setCursorClass(MapCursorHelper.COPY_CLASS, enabled);
  }

  private static setCursorClass(cursorClass: string, enabled: boolean) {
    const el = document.querySelector('.map-container');
    if (!el) {
      return;
    }
    if (enabled) {
      el.classList.add(cursorClass);
    } else {
      el.classList.remove(cursorClass);
    }
  }

}
