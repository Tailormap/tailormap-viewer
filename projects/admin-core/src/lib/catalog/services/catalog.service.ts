import { Inject, Injectable, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  CatalogItemKindEnum, CatalogItemModel, GeoServiceWithLayersModel, TAILORMAP_ADMIN_API_V1_SERVICE, TailormapAdminApiV1ServiceModel,
} from '@tailormap-admin/admin-api';
import { catchError, concatMap, filter, forkJoin, of, Subject, takeUntil, timer } from 'rxjs';
import { ExtendedCatalogNodeModel } from '../models/extended-catalog-node.model';
import { selectCatalogNodeById, selectGeoServices } from '../state/catalog.selectors';
import { addGeoServices } from '../state/catalog.actions';
import { ExtendedGeoServiceModel } from '../models/extended-geo-service.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SnackBarMessageComponent } from '@tailormap-viewer/shared';

@Injectable({
  providedIn: 'root',
})
export class CatalogService implements OnDestroy {

  private destroyed = new Subject();
  private loadServiceSubscriptions = new Map<string, Subject<null>>();
  private geoServices: Map<string, ExtendedGeoServiceModel> = new Map();

  constructor(
    private store$: Store,
    @Inject(TAILORMAP_ADMIN_API_V1_SERVICE) private adminApiService: TailormapAdminApiV1ServiceModel,
    private snackBar: MatSnackBar,
  ) {
    this.store$.select(selectGeoServices).pipe(takeUntil(this.destroyed)).subscribe(services => {
      this.geoServices = new Map(services.map(service => [ service.id, service ]));
    });
  }

  public ngOnDestroy() {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  public loadCatalogNodeItems$(nodeId: string) {
    this.cancelCurrentSubscription(nodeId);
    const newSubscription = new Subject<null>();
    this.loadServiceSubscriptions.set(nodeId, newSubscription);
    const sub = new Subject<boolean>();
    this.store$.select(selectCatalogNodeById(nodeId)).pipe(
      takeUntil(newSubscription),
      filter((node): node is ExtendedCatalogNodeModel => !!node && (node.items || []).length > 0),
      concatMap(node => {
        const serviceItems = (node.items || []).filter(item => item.kind === CatalogItemKindEnum.GEO_SERVICE);
        const services$ = this.getServiceRequests$(serviceItems);
        return forkJoin(services$);
      }),
    ).subscribe(responses => {
      const hasError = responses.some(response => response === null);
      if (hasError) {
        SnackBarMessageComponent.open$(this.snackBar, {
          message: $localize `Error while loading service(s). Please collapse/expand the node again to try again.`,
          duration: 5000,
          showCloseButton: true,
        }).pipe(takeUntil(newSubscription)).subscribe();
      }
      const services = responses.filter((response): response is GeoServiceWithLayersModel => response !== null);
      if (services.length > 0) {
        this.store$.dispatch(addGeoServices({ services, parentNode: nodeId }));
      }
      sub.next(true);
      sub.complete();
    });
    return sub;
  }

  private getServiceRequests$(serviceItems: CatalogItemModel[]) {
    return serviceItems.filter(item => !this.geoServices.has(item.id)).map(item => {
      return this.adminApiService.getGeoService$({ id: item.id })
        .pipe(
          catchError(() => {
            return of(null);
          }),
        );
    });
  }

  private cancelCurrentSubscription(nodeId: string) {
    const currentSubscription = this.loadServiceSubscriptions.get(nodeId);
    if (currentSubscription) {
      currentSubscription.next(null);
      currentSubscription.complete();
    }
  }

}
