import { ChangeDetectionStrategy, Component, DestroyRef, Input, inject } from '@angular/core';
import {
  BaseComponentTypeEnum,
  MOUSE_COORDINATES_MAP_PROJECTION,
  MouseCoordinatesConfigModel,
  MouseCoordinatesDisplayConfigModel,
  MouseCoordinatesFormat,
} from '@tailormap-viewer/api';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime } from 'rxjs';
import { nanoid } from 'nanoid';
import { ComponentConfigurationService } from '../../services/component-configuration.service';
import { ConfigurationComponentModel } from '../configuration-component.model';
import { AdminProjectionsHelper } from '../../helpers/admin-projections-helper';
import { BaseComponentConfigComponent } from '../base-component-config/base-component-config.component';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatOption, MatSelect } from '@angular/material/select';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { InfoMessageComponent } from '@tailormap-viewer/shared';

type DisplayFormType = FormGroup<{
  id: FormControl<string>;
  projection: FormControl<string>;
  format: FormControl<MouseCoordinatesFormat>;
}>;

@Component({
  selector: 'tm-admin-mouse-coordinates-config',
  templateUrl: './mouse-coordinates-config.component.html',
  styleUrls: ['./mouse-coordinates-config.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    BaseComponentConfigComponent,
    InfoMessageComponent,
    ReactiveFormsModule,
    MatFormField,
    MatLabel,
    MatSelect,
    MatOption,
    MatIconButton,
    MatIcon,
    MatButton,
  ],
})
export class MouseCoordinatesConfigComponent implements ConfigurationComponentModel<MouseCoordinatesConfigModel> {
  private componentConfigService = inject(ComponentConfigurationService);
  private destroyRef = inject(DestroyRef);

  @Input()
  public type: BaseComponentTypeEnum | undefined;

  @Input()
  public label: string | undefined;

  @Input()
  public set config(config: MouseCoordinatesConfigModel | undefined) {
    this._config = config;
    this.initForm(config);
  }

  public get config() {
    return this._config;
  }

  private _config: MouseCoordinatesConfigModel | undefined;

  public formGroup = new FormGroup({
    displays: new FormArray<DisplayFormType>([]),
  });

  public projections = [
    {
      code: MOUSE_COORDINATES_MAP_PROJECTION,
      label: $localize `:@@admin-core.components.mouse-coordinates-map-crs:Map CRS`,
    },
    { code: 'EPSG:4326', label: 'EPSG:4326 (WGS84)' },
    ...AdminProjectionsHelper.projections,
  ];

  public get displayList() {
    return this.formGroup.get('displays') as FormArray<DisplayFormType>;
  }

  constructor() {
    this.formGroup.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef), debounceTime(250))
      .subscribe(() => this.saveConfig());
  }

  public initForm(config: MouseCoordinatesConfigModel | undefined) {
    const displays = config?.displays || [];
    const configuredIds = new Set(displays.map(display => display.id));

    for (let index = this.displayList.length - 1; index >= 0; index--) {
      const id = this.displayList.at(index).controls.id.value;
      if (!configuredIds.has(id)) {
        this.displayList.removeAt(index, { emitEvent: false });
      }
    }

    const existingIds = new Set(this.displayList.controls.map(group => group.controls.id.value));
    displays.forEach(display => {
      if (existingIds.has(display.id)) {
        this.displayList.controls.find(group => group.controls.id.value === display.id)?.patchValue(display, { emitEvent: false });
      } else {
        this.displayList.push(this.createForm(display), { emitEvent: false });
      }
    });
  }

  public addDisplay() {
    this.displayList.push(this.createForm());
    this.saveConfig();
  }

  public deleteDisplay(displayIndex: number) {
    this.displayList.removeAt(displayIndex);
    this.saveConfig();
  }

  private saveConfig() {
    const values = this.formGroup.getRawValue();
    const displays = values.displays.map<MouseCoordinatesDisplayConfigModel>(display => {
      const projection = display.projection || MOUSE_COORDINATES_MAP_PROJECTION;
      const format: MouseCoordinatesFormat =
        projection === 'EPSG:4326'
          ? (display.format || 'xy')
          : 'xy';

      return {
        id: display.id || nanoid(),
        projection,
        format,
      };
    });

    this.componentConfigService.updateConfigForKey<MouseCoordinatesConfigModel>(this.type, 'displays', displays);
  }

  private createForm(display?: MouseCoordinatesDisplayConfigModel): DisplayFormType {
    return new FormGroup({
      id: new FormControl<string>(display?.id || nanoid(), { nonNullable: true }),
      projection: new FormControl<string>(display?.projection || MOUSE_COORDINATES_MAP_PROJECTION, { nonNullable: true }),
      format: new FormControl<MouseCoordinatesFormat>(display?.format || 'xy', { nonNullable: true }),
    });
  }
}
