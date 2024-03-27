import { Component, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { Observable } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { RoutePropertyHelper } from '../helpers/route-property.helper';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'tm-admin-form-page',
  templateUrl: './form-page.component.html',
  styleUrls: ['./form-page.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormPageComponent {

  public className$: Observable<string>;

  constructor(
    route: ActivatedRoute,
    router: Router,
    destroyRef: DestroyRef,
  ) {
    this.className$ = RoutePropertyHelper.getPropForRoute$(router, route, 'className')
      .pipe(takeUntilDestroyed(destroyRef));
  }

}
