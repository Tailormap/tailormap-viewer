import { Store } from '@ngrx/store';
import { selectActiveTool } from './state/toolbar.selectors';
import { ToolbarComponentEnum } from './models/toolbar-component.enum';
import { take } from 'rxjs';
import { MapCursorHelper } from '@tailormap-viewer/map';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ToolbarService {

  private crosshairTools = [
    ToolbarComponentEnum.COORDINATE_LINK_WINDOW,
    ToolbarComponentEnum.SELECT_COORDINATES,
    ToolbarComponentEnum.STREETVIEW,
  ];

  constructor(
    private store$: Store,
  ) {
  }

  public getActiveToolbarComponent$() {
    return this.store$.select(selectActiveTool);
  }

  public setCrosshairCursorOnMap(enable?: boolean) {
    this.getActiveToolbarComponent$()
      .pipe(take(1))
      .subscribe(tool => {
        // If we pass true, always enable
        // If we pass falsy, check if there are default tools enabled which require crosshair
        const useCrosshair = enable === true || (!!tool && this.crosshairTools.includes(tool));
        MapCursorHelper.setCrosshairCursor(useCrosshair);
      });
  }

}
