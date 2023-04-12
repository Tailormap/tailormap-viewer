import { Component, OnInit, ChangeDetectionStrategy, inject, ChangeDetectorRef, Input, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { Subject, take, takeUntil } from 'rxjs';
import { ComponentBaseConfigModel } from '@tailormap-viewer/api';
import { selectComponentsConfigByType, selectSelectedApplicationId } from '../../state/application.selectors';
import { ComponentConfigHelper } from '../../helpers/component-config.helper';
import { updateApplicationComponentConfig } from '../../state/application.actions';

@Component({
  selector: 'tm-admin-base-component-config',
  templateUrl: './base-component-config.component.html',
  styleUrls: ['./base-component-config.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaseComponentConfigComponent implements OnInit, OnDestroy {

  constructor() { }

  private store$ = inject(Store);
  private cdr = inject(ChangeDetectorRef);
  private destroyed = new Subject();

  @Input()
  public type: string | undefined;

  @Input()
  public label: string | undefined;

  public config: ComponentBaseConfigModel | undefined = undefined;

  public ngOnInit(): void {
    if (!this.type) {
      throw new Error('No type given');
    }
    const type = this.type;
    this.store$.select(selectComponentsConfigByType(type))
      .pipe(takeUntil(this.destroyed))
      .subscribe(config => {
        this.config = config?.config || ComponentConfigHelper.getBaseConfig();
        this.cdr.detectChanges();
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

    this.store$.select(selectSelectedApplicationId)
      .pipe(take(1))
      .subscribe(applicationId => {
        if (!applicationId) {
          return;
        }
        if (!this.config || !this.type) {
          return;
        }
        this.store$.dispatch(updateApplicationComponentConfig({
          applicationId,
          componentType: this.type,
          config: {
            ...this.config,
            enabled: !this.config.enabled,
          },
        }));
      });
  }

}
