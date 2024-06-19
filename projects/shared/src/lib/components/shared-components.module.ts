import { NgModule } from '@angular/core';
import { SnackBarMessageComponent } from './snackbar-message';
import { SharedImportsModule } from '../shared-imports.module';
import { ErrorMessageComponent } from './error-message/error-message.component';
import { TreeComponent } from './tree';
import { SplitButtonComponent } from './split-button/split-button.component';
import { ColorPickerComponent } from './color-picker/color-picker.component';
import { IconPickerComponent } from './icon-picker/icon-picker.component';
import { ConfirmDialogComponent } from './confirm-dialog/confirm-dialog.component';
import { PanelResizerComponent } from './panel-resizer';
import { SliderComponent } from './slider/slider.component';
import { SharedDirectivesModule } from '../directives/shared-directives.module';
import { AboutDialogComponent } from './about-dialog/about-dialog.component';
import { LanguageToggleComponent } from './language-toggle/language-toggle.component';
import { CdkFixedSizeVirtualScroll, CdkVirtualForOf, CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { InfoMessageComponent } from './info-message';
import { LegendImageComponent } from './legend-image/legend-image.component';

@NgModule({
  declarations: [
    SnackBarMessageComponent,
    ErrorMessageComponent,
    InfoMessageComponent,
    TreeComponent,
    SplitButtonComponent,
    ColorPickerComponent,
    IconPickerComponent,
    ConfirmDialogComponent,
    PanelResizerComponent,
    SliderComponent,
    AboutDialogComponent,
    LanguageToggleComponent,
    LegendImageComponent,
  ],
  imports: [
    SharedImportsModule,
    SharedDirectivesModule,
    CdkVirtualScrollViewport,
    CdkFixedSizeVirtualScroll,
    CdkVirtualForOf,
  ],
  exports: [
    SnackBarMessageComponent,
    ErrorMessageComponent,
    TreeComponent,
    SplitButtonComponent,
    ColorPickerComponent,
    IconPickerComponent,
    PanelResizerComponent,
    SliderComponent,
    LanguageToggleComponent,
    InfoMessageComponent,
    LegendImageComponent,
  ],
})
export class SharedComponentsModule {
}
