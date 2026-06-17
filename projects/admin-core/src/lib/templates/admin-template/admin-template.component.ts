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
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  public className$: Observable<string>;
  public pageTitle$: Observable<string>;

  constructor() {
    this.className$ = RoutePropertyHelper.getPropForRoute$(this.router, this.route, 'templateCls')
      .pipe(takeUntilDestroyed(this.destroyRef));
    this.pageTitle$ = RoutePropertyHelper.getPropForRoute$(this.router, this.route, 'pageTitle')
      .pipe(takeUntilDestroyed(this.destroyRef));
    if (firstRun) {
      this.router.navigateByUrl(this.router.routerState.snapshot.url);
      firstRun = false;
    }
  }

}
