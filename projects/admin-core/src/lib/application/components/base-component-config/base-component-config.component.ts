import { Component, OnInit, ChangeDetectionStrategy, inject, ChangeDetectorRef, Input, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { Subject, takeUntil } from 'rxjs';
import { BaseComponentTypeEnum, ComponentBaseConfigModel } from '@tailormap-viewer/api';
import { selectComponentsConfigByType } from '../../state/application.selectors';
import { ComponentConfigHelper } from '../../helpers/component-config.helper';
import { updateApplicationComponentConfig } from '../../state/application.actions';
import { FormControl, FormGroup } from '@angular/forms';

@Component({
  selector: 'tm-admin-base-component-config',
  templateUrl: './base-component-config.component.html',
  styleUrls: ['./base-component-config.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaseComponentConfigComponent implements OnInit, OnDestroy {

  private store$ = inject(Store);
  private cdr = inject(ChangeDetectorRef);
  private destroyed = new Subject();

  @Input()
  public type: BaseComponentTypeEnum | undefined;

  @Input()
  public label: string | undefined;

  public config: ComponentBaseConfigModel | undefined = undefined;

  public formGroup = new FormGroup({
    title: new FormControl<string>(''),
  });

  public ngOnInit(): void {
    if (!this.type) {
      throw new Error('No type given');
    }
    const type = this.type;
    this.store$.select(selectComponentsConfigByType(type))
      .pipe(takeUntil(this.destroyed))
      .subscribe(config => {
        this.config = config?.config || ComponentConfigHelper.getBaseConfig(type);
        this.formGroup.patchValue({
          title: this.config?.title || '',
        }, { emitEvent: false, onlySelf: true });
        this.cdr.detectChanges();
      });
    this.formGroup.valueChanges
      .pipe(takeUntil(this.destroyed))
      .subscribe(values => {
        this.updateConfig('title', values.title);
      });
  }

  public ngOnDestroy() {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  public getEnabled() {
    if (!this.config) {
      return false;
    }
    return this.config.enabled;
  }

  public toggleEnabled() {
    if (!this.config || !this.type) {
      return;
    }
    this.updateConfig('enabled', !this.config.enabled);
  }

  private updateConfig(key: keyof ComponentBaseConfigModel, value: string | number | boolean | undefined | null) {
    if (!this.config || !this.type || this.config[key] === value) {
      return;
    }
    this.store$.dispatch(updateApplicationComponentConfig({
      componentType: this.type,
      config: { ...this.config, [key]: value },
    }));
  }

}
