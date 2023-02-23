import { Component, OnInit, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { BehaviorSubject, distinctUntilChanged, filter, map, Observable, of, Subject, switchMap, takeUntil } from 'rxjs';
import { selectGeoServiceById } from '../state/catalog.selectors';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { ExtendedGeoServiceModel } from '../models/extended-geo-service.model';
import { GeoServiceService } from '../services/geo-service.service';
import { GeoServiceUpdateModel } from '../models/geo-service-update.model';

@Component({
  selector: 'tm-admin-geo-service-details',
  templateUrl: './geo-service-details.component.html',
  styleUrls: ['./geo-service-details.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GeoServiceDetailsComponent implements OnInit, OnDestroy {

  public geoService$: Observable<ExtendedGeoServiceModel | null> = of(null);
  private destroyed = new Subject();
  public updatedGeoService: GeoServiceUpdateModel | null = null;

  private savingSubject = new BehaviorSubject(false);
  public saving$ = this.savingSubject.asObservable();

  constructor(
    private route: ActivatedRoute,
    private store$: Store,
    private geoServiceService: GeoServiceService,
  ) { }

  public ngOnInit(): void {
    this.geoService$ = this.route.paramMap.pipe(
      takeUntil(this.destroyed),
      map(params => params.get('serviceId')),
      distinctUntilChanged(),
      filter((serviceId): serviceId is string => !!serviceId),
      switchMap(serviceId => this.store$.select(selectGeoServiceById(serviceId))),
    );
  }

  public ngOnDestroy(): void {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  public updateGeoService($event: GeoServiceUpdateModel) {
    this.updatedGeoService = $event;
  }

  public save(geoServiceId: string, catalogNodeId: string) {
    if (!this.updatedGeoService) {
      return;
    }
    this.savingSubject.next(true);
    this.geoServiceService.updateGeoService$({ ...this.updatedGeoService, id: geoServiceId }, catalogNodeId)
      .pipe(takeUntil(this.destroyed))
      .subscribe(() => this.savingSubject.next(false));
  }

}
