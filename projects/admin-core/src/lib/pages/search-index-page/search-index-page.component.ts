import { Component, ChangeDetectionStrategy, DestroyRef, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { RoutePropertyHelper } from '../helpers/route-property.helper';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SearchIndexPingResponseModel, TAILORMAP_ADMIN_API_V1_SERVICE } from '@tailormap-admin/admin-api';

@Component({
  selector: 'tm-admin-search-index-page',
  templateUrl: './search-index-page.component.html',
  styleUrls: ['./search-index-page.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class SearchIndexPageComponent {

  public className$: Observable<string>;

  public searchIndexPingResponse$: Observable<SearchIndexPingResponseModel>;

  constructor() {
    const route = inject(ActivatedRoute);
    const router = inject(Router);
    const destroyRef = inject(DestroyRef);
    const adminApiService = inject(TAILORMAP_ADMIN_API_V1_SERVICE);

    this.className$ = RoutePropertyHelper.getPropForRoute$(router, route, 'className')
      .pipe(takeUntilDestroyed(destroyRef));
    this.searchIndexPingResponse$ = adminApiService.pingSearchIndexEngine$();
  }

}
