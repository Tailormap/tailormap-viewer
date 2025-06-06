import { Component, ChangeDetectionStrategy, Input, DestroyRef } from '@angular/core';
import { BaseComponentTypeEnum, MeasureComponentConfigModel } from '@tailormap-viewer/api';
import { FormControl, FormGroup } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ComponentConfigurationService } from '../../services/component-configuration.service';
import { ConfigurationComponentModel } from '../configuration-component.model';

@Component({
  selector: 'tm-admin-measure-component-config',
  templateUrl: './measure-component-config.component.html',
  styleUrls: ['./measure-component-config.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class MeasureComponentConfigComponent implements ConfigurationComponentModel<MeasureComponentConfigModel> {

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

  constructor(
    private componentConfigService: ComponentConfigurationService,
    private destroyRef: DestroyRef,
  ) {
    this.formGroup.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(values => {
        this.componentConfigService.updateConfigForKey<MeasureComponentConfigModel>(this.type, 'titleMeasureArea', values.titleMeasureArea);
      });
  }

}
