import { Component, ChangeDetectionStrategy, DestroyRef, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { RoutePropertyHelper } from '../helpers/route-property.helper';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SearchIndexPingResponseModel, TailormapAdminApiV1Service } from '@tailormap-admin/admin-api';
import { AdminPageTemplateComponent } from '../../templates/admin-page-template/admin-page-template.component';
import { SearchIndexListComponent } from '../../search-index/search-index-list/search-index-list.component';
import { AsyncPipe } from '@angular/common';
import { ErrorMessageComponent } from '@tailormap-viewer/shared';

@Component({
    selector: 'tm-admin-search-index-page',
    templateUrl: './search-index-page.component.html',
    styleUrls: ['./search-index-page.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        AdminPageTemplateComponent,
        SearchIndexListComponent,
        ErrorMessageComponent,
        AsyncPipe,
    ],
})
export class SearchIndexPageComponent {

  public className$: Observable<string>;

  public searchIndexPingResponse$: Observable<SearchIndexPingResponseModel>;

  constructor() {
    const route = inject(ActivatedRoute);
    const router = inject(Router);
    const destroyRef = inject(DestroyRef);
    const adminApiService = inject(TailormapAdminApiV1Service);

    this.className$ = RoutePropertyHelper.getPropForRoute$(router, route, 'className')
      .pipe(takeUntilDestroyed(destroyRef));
    this.searchIndexPingResponse$ = adminApiService.pingSearchIndexEngine$();
  }

}
