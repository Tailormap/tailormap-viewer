import { Component, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { RoutePropertyHelper } from '../helpers/route-property.helper';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'tm-admin-application-page',
  templateUrl: './application-page.component.html',
  styleUrls: ['./application-page.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApplicationPageComponent {

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
