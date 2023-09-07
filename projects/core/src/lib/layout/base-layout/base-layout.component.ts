import { Component, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { selectComponentsConfig } from '../../state/core.selectors';
import { BaseComponentTypeEnum, BaseComponentConfigHelper, ComponentModel } from '@tailormap-viewer/api';
import { Observable, of } from 'rxjs';

@Component({
  selector: 'tm-base-layout',
  templateUrl: './base-layout.component.html',
  styleUrls: ['./base-layout.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaseLayoutComponent implements OnInit {

  private store$ = inject(Store);
  public componentsConfig$: Observable<ComponentModel[]> = of([]);
  public componentTypes = BaseComponentTypeEnum;

  public ngOnInit(): void {
    this.componentsConfig$ = this.store$.select(selectComponentsConfig);
  }

  public isComponentEnabled(config: ComponentModel[], componentType: string) {
    return BaseComponentConfigHelper.isComponentEnabled(config, componentType);
  }

}
