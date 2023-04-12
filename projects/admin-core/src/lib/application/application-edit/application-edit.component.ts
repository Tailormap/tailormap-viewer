import { Component, OnInit, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { distinctUntilChanged, filter, map, Observable, of, Subject, takeUntil } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { selectSelectedApplication } from '../state/application.selectors';
import { ApplicationModel } from '@tailormap-admin/admin-api';
import { RoutesEnum } from '../../routes';
import { setSelectedApplication } from '../state/application.actions';

@Component({
  selector: 'tm-admin-application-edit',
  templateUrl: './application-edit.component.html',
  styleUrls: ['./application-edit.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApplicationEditComponent implements OnInit, OnDestroy {

  private destroyed = new Subject();
  public application$: Observable<ApplicationModel | null> = of(null);

  public readonly routes = RoutesEnum;

  constructor(
    private route: ActivatedRoute,
    private store$: Store,
  ) {
    this.route.paramMap.pipe(
      takeUntil(this.destroyed),
      map(params => params.get('applicationId')),
      distinctUntilChanged(),
      filter((appId): appId is string => !!appId),
    ).subscribe(applicationId => {
      this.store$.dispatch(setSelectedApplication({ applicationId }));
    });
    this.application$ = this.store$.select(selectSelectedApplication);
  }

  public ngOnInit(): void {
  }

  public ngOnDestroy(): void {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  public getUrl(applicationId: string, route: 'settings' | 'layers') {
    const routes = {
      settings: '',
      layers: RoutesEnum.APPLICATION_DETAILS_LAYERS,
    };
    const url = [
      RoutesEnum.APPLICATION,
      RoutesEnum.APPLICATION_DETAILS.replace(':applicationId', applicationId),
    ];
    if (routes[route]) {
      url.push(routes[route]);
    }
    return url.join('/');
  }

}
