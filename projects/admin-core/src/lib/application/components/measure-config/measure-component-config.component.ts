import { Component, ChangeDetectionStrategy, Input, DestroyRef, inject } from '@angular/core';
import { BaseComponentTypeEnum, MeasureComponentConfigModel } from '@tailormap-viewer/api';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ComponentConfigurationService } from '../../services/component-configuration.service';
import { ConfigurationComponentModel } from '../configuration-component.model';
import { BaseComponentConfigComponent } from '../base-component-config/base-component-config.component';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';

@Component({
    selector: 'tm-admin-measure-component-config',
    templateUrl: './measure-component-config.component.html',
    styleUrls: ['./measure-component-config.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        BaseComponentConfigComponent,
        ReactiveFormsModule,
        MatFormField,
        MatLabel,
        MatInput,
    ],
})
export class MeasureComponentConfigComponent implements ConfigurationComponentModel<MeasureComponentConfigModel> {
  private componentConfigService = inject(ComponentConfigurationService);
  private destroyRef = inject(DestroyRef);


  @Input()
  public type: BaseComponentTypeEnum | undefined;

  @Input()
  public label: string | undefined;

  @Input()
  public set config(config: MeasureComponentConfigModel | undefined) {
    this._config = config;
    this.formGroup.patchValue({
      titleMeasureArea: config?.titleMeasureArea || '',
    }, { emitEvent: false, onlySelf: true });
  }
  public get config() {
    return this._config;
  }
  private _config: MeasureComponentConfigModel | undefined;

  public formGroup = new FormGroup({
    titleMeasureArea: new FormControl<string>(''),
  });

  constructor() {
    this.formGroup.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(values => {
        this.componentConfigService.updateConfigForKey<MeasureComponentConfigModel>(this.type, 'titleMeasureArea', values.titleMeasureArea);
      });
  }

}
