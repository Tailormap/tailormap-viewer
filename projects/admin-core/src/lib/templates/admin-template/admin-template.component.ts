import { Component, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { RoutePropertyHelper } from '../../pages/helpers/route-property.helper';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'tm-admin-template',
  templateUrl: './admin-template.component.html',
  styleUrls: ['./admin-template.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminTemplateComponent {

  public className$: Observable<string>;
  public pageTitle$: Observable<string>;

  constructor(
    route: ActivatedRoute,
    router: Router,
    destroyRef: DestroyRef,
  ) {
    this.className$ = RoutePropertyHelper.getPropForRoute$(router, route, 'templateCls')
      .pipe(takeUntilDestroyed(destroyRef));
    this.pageTitle$ = RoutePropertyHelper.getPropForRoute$(router, route, 'pageTitle')
      .pipe(takeUntilDestroyed(destroyRef));
  }

}
