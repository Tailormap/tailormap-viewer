import { Component, ChangeDetectionStrategy, Input, DestroyRef } from '@angular/core';
import {
  BaseComponentTypeEnum, HEADER_LOGO_CATEGORY, HeaderComponentConfigModel, HeaderMenuItemModel,
} from '@tailormap-viewer/api';
import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ComponentConfigurationService } from '../../services/component-configuration.service';
import { ConfigurationComponentModel } from '../configuration-component.model';
import { PopoverPositionEnum } from '@tailormap-viewer/shared';
import { UPLOAD_REMOVE_SERVICE } from '../../../shared/components/select-upload/models/upload-remove-service.injection-token';
import { HeaderComponentLogoRemoveService } from './header-component-logo-remove.service';
import { debounceTime } from 'rxjs/operators';
import { nanoid } from 'nanoid';

type MenuItemType = FormGroup<{
  id: FormControl<string>;
  label: FormControl<string>;
  url: FormControl<string>;
}>;

@Component({
  selector: 'tm-admin-header-component-config',
  templateUrl: './header-component-config.component.html',
  styleUrls: ['./header-component-config.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
  providers: [
    { provide: UPLOAD_REMOVE_SERVICE, useClass: HeaderComponentLogoRemoveService },
  ],
})
export class HeaderComponentConfigComponent implements ConfigurationComponentModel<HeaderComponentConfigModel> {

  @Input()
  public type: BaseComponentTypeEnum | undefined;

  @Input()
  public label: string | undefined;

  @Input()
  public set config(config: HeaderComponentConfigModel | undefined) {
    this._config = config;
    this.heightControl.patchValue(config?.height ?? 100, { emitEvent: false, onlySelf: true });
    this.cssControl.patchValue(config?.css ?? '', { emitEvent: false, onlySelf: true });
    this.initMenuItems(config);
  }
  public get config() {
    return this._config;
  }
  private _config: HeaderComponentConfigModel | undefined;

  public heightControl = new FormControl<number>(100, { nonNullable: true });
  public cssControl = new FormControl<string>('', { nonNullable: true });
  public menuItems = new FormArray<MenuItemType>([]);

  public readonly HEADER_LOGO_CATEGORY = HEADER_LOGO_CATEGORY;
  public dropdownPosition = PopoverPositionEnum.BOTTOM_LEFT_DOWN;

  constructor(
    private componentConfigService: ComponentConfigurationService,
    private destroyRef: DestroyRef,
  ) {
    this.heightControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(height => {
        if (!height && height !== 0) {
          return;
        }
        this.componentConfigService.updateConfigForKey<HeaderComponentConfigModel>(this.type, 'height', height);
      });
    this.cssControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef), debounceTime(500))
      .subscribe(css => {
        this.componentConfigService.updateConfigForKey<HeaderComponentConfigModel>(this.type, 'css', css);
      });
    this.menuItems.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef), debounceTime(500))
      .subscribe(() => this.saveMenuItems());
  }

  public onImageChanged($event: string | null) {
    this.componentConfigService.updateConfigForKey<HeaderComponentConfigModel>(this.type, 'logoFileId', $event || '');
  }

  public onBackgroundColorChanged($event: string | null) {
    this.componentConfigService.updateConfigForKey<HeaderComponentConfigModel>(this.type, 'backgroundColor', $event || '');
  }

  public onTextColorChanged($event: string | null) {
    this.componentConfigService.updateConfigForKey<HeaderComponentConfigModel>(this.type, 'textColor', $event || '');
  }

  private initMenuItems(config?: HeaderComponentConfigModel) {
    const curIds = new Set((config?.menuItems || []).map(u => u.id));
    const existingFormIds = new Set(this.menuItems.controls.map(group => group.value.id ?? ''));
    const idxToRemove = this.menuItems.controls
      .filter(group => !curIds.has(group.value.id ?? ''))
      .map((_group, idx) => idx);
    idxToRemove.forEach(idx => this.menuItems.removeAt(idx));
    config?.menuItems?.forEach(item => {
      if (existingFormIds.has(item.id)) {
        this.menuItems.controls.find(u => u.value.id === item.id)?.patchValue({
          id: item.id,
          label: item.label,
          url: item.url,
        }, { emitEvent: false });
      } else {
        this.menuItems.push(this.createForm(item), { emitEvent: false });
      }
    });
    if (this.menuItems.length === 0) {
      this.addMenuItem();
    }
  }

  public addMenuItem() {
    this.menuItems.push(this.createForm());
    this.saveMenuItems();
  }

  public deleteMenuItem(idx: number) {
    this.menuItems.removeAt(idx);
    this.saveMenuItems();
  }

  private createForm(item?: HeaderMenuItemModel): MenuItemType {
    return new FormGroup({
      id: new FormControl<string>(item?.id || nanoid(), { nonNullable: true }),
      label: new FormControl<string>(item ? item.label : '', { nonNullable: true }),
      url: new FormControl<string>(item ? item.url : '', { nonNullable: true }),
    });
  }

  private saveMenuItems() {
    const values = this.menuItems.value;
    const menuItems: HeaderMenuItemModel[] = (values || [])
      .map<HeaderMenuItemModel>(u => ({
        id: u.id ?? nanoid(),
        label: u.label ?? '',
        url: u.url ?? '',
      }));
    this.componentConfigService.updateConfigForKey<HeaderComponentConfigModel>(this.type, 'menuItems', menuItems);
  }

}
