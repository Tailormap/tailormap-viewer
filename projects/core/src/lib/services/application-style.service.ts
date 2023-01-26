import { Injectable, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { selectApplicationStyling } from '../state/core.selectors';
import { takeUntil } from 'rxjs/operators';
import { distinctUntilChanged, Subject } from 'rxjs';
import { ColorHelper, CssHelper } from '@tailormap-viewer/shared';
import { AppStylingModel } from '@tailormap-viewer/api';
import { updateApplicationStyle } from '../state/core.actions';
import { MaterialCssVarsService } from 'angular-material-css-vars';

@Injectable({
  providedIn: 'root',
})
export class ApplicationStyleService implements OnDestroy {

  private destroyed = new Subject();

  private static initialPrimaryColor = CssHelper.getCssVariableValue('--primary-color');

  constructor(
    private store$: Store,
    private materialCssVarsService: MaterialCssVarsService,
  ) {
    this.store$.select(selectApplicationStyling)
      .pipe(takeUntil(this.destroyed), distinctUntilChanged())
      .subscribe((appStyling) => {
        this.updateStyling(appStyling);
      });
  }

  public resetStyling() {
    this.store$.dispatch(updateApplicationStyle({ style: { primaryColor: ApplicationStyleService.initialPrimaryColor } }));
  }

  private updateStyling(appStyling?: AppStylingModel | null) {
    if (appStyling && appStyling.primaryColor) {
      this.materialCssVarsService.setPrimaryColor(appStyling.primaryColor);
      CssHelper.setCssVariableValue('--primary-color', ColorHelper.getRgbStyleForColor(appStyling.primaryColor));
      CssHelper.setCssVariableValue('--primary-color-0_6', ColorHelper.getRgbStyleForColor(appStyling.primaryColor, 60));
      CssHelper.setCssVariableValue('--primary-color-0_5', ColorHelper.getRgbStyleForColor(appStyling.primaryColor, 50));
      CssHelper.setCssVariableValue('--primary-color-0_4', ColorHelper.getRgbStyleForColor(appStyling.primaryColor, 40));
      CssHelper.setCssVariableValue('--primary-color-0_1', ColorHelper.getRgbStyleForColor(appStyling.primaryColor, 10));
    }
  }

  public static getPrimaryColor(): string {
    return CssHelper.getCssVariableValue('--primary-color');
  }

  public ngOnDestroy() {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

}
