import { Component, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { Observable } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { RoutePropertyHelper } from '../helpers/route-property.helper';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'tm-admin-search-index-page',
  templateUrl: './search-index-page.component.html',
  styleUrls: ['./search-index-page.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchIndexPageComponent {

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
