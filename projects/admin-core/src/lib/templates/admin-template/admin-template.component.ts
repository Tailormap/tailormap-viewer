import { Component, ChangeDetectionStrategy, DestroyRef, inject } from '@angular/core';
import { RoutePropertyHelper } from '../../pages/helpers/route-property.helper';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';

// Little hack to prevent child components being initialized twice. Angular for some reason creates the component twice, first on loading,
// then after the first route change again. See https://github.com/angular/angular/issues/18374
let firstRun = true;

@Component({
  selector: 'tm-admin-template',
  templateUrl: './admin-template.component.html',
  styleUrls: ['./admin-template.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class AdminTemplateComponent {

  public className$: Observable<string>;
  public pageTitle$: Observable<string>;

  constructor() {
    const route = inject(ActivatedRoute);
    const router = inject(Router);
    const destroyRef = inject(DestroyRef);

    this.className$ = RoutePropertyHelper.getPropForRoute$(router, route, 'templateCls')
      .pipe(takeUntilDestroyed(destroyRef));
    this.pageTitle$ = RoutePropertyHelper.getPropForRoute$(router, route, 'pageTitle')
      .pipe(takeUntilDestroyed(destroyRef));
    if (firstRun) {
      router.navigateByUrl(router.routerState.snapshot.url);
      firstRun = false;
    }
  }

}
