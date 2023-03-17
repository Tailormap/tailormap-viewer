import { Injectable, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { selectViewerStyling } from '../state/core.selectors';
import { takeUntil } from 'rxjs/operators';
import { distinctUntilChanged, Subject } from 'rxjs';
import { ColorHelper, ColorPaletteHelper, CssHelper } from '@tailormap-viewer/shared';
import { ViewerStylingModel } from '@tailormap-viewer/api';
import { updateViewerStyle } from '../state/core.actions';

@Injectable({
  providedIn: 'root',
})
export class ApplicationStyleService implements OnDestroy {

  private destroyed = new Subject();

  private static initialPrimaryColor = CssHelper.getCssVariableValue('--primary-color');

  constructor(private store$: Store) {
    this.store$.select(selectViewerStyling)
      .pipe(takeUntil(this.destroyed), distinctUntilChanged())
      .subscribe((appStyling) => {
        this.updateStyling(appStyling);
      });
  }

  public resetStyling() {
    this.store$.dispatch(updateViewerStyle({ style: { primaryColor: ApplicationStyleService.initialPrimaryColor } }));
  }

  private updateStyling(appStyling?: ViewerStylingModel | null) {
    if (appStyling && appStyling.primaryColor) {
      const primaryPalette = ColorPaletteHelper.createPalette(appStyling.primaryColor);
      primaryPalette.forEach((color) => CssHelper.setCssVariableValue(color.name, color.val));
      CssHelper.setCssVariableValue('--primary-color', ColorHelper.getRgbStyleForColor(appStyling.primaryColor));
      CssHelper.setCssVariableValue('--primary-color-0_5', ColorHelper.getRgbStyleForColor(appStyling.primaryColor, 50));
      CssHelper.setCssVariableValue('--primary-color-0_1', ColorHelper.getRgbStyleForColor(appStyling.primaryColor, 10));
    }
  }

  public static getPrimaryColor(): string {
    return CssHelper.getCssVariableValue('--primary-color').trim();
  }

  public ngOnDestroy() {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

}
