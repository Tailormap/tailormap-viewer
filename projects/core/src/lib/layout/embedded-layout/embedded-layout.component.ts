import { Component, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { selectComponentsConfig } from '../../state/core.selectors';
import { BaseComponentTypeEnum, BaseComponentConfigHelper, ComponentModel } from '@tailormap-viewer/api';
import { Observable, of } from 'rxjs';

@Component({
  selector: 'tm-embedded-layout',
  templateUrl: './embedded-layout.component.html',
  styleUrls: ['./embedded-layout.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmbeddedLayoutComponent implements OnInit {

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
