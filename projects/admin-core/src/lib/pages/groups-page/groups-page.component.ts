import { Component, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { RoutePropertyHelper } from '../helpers/route-property.helper';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'tm-admin-groups-page',
  templateUrl: './groups-page.component.html',
  styleUrls: ['./groups-page.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupsPageComponent {

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
