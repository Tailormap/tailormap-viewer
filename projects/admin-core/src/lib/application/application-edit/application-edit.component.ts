import { Component, OnInit, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { distinctUntilChanged, filter, map, Observable, of, Subject, takeUntil } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { selectSelectedApplication } from '../state/application.selectors';
import { ApplicationModel } from '@tailormap-admin/admin-api';
import { RoutesEnum } from '../../routes';
import { ApplicationTreeService } from '../services/application-tree.service';

@Component({
  selector: 'tm-admin-application-edit',
  templateUrl: './application-edit.component.html',
  styleUrls: ['./application-edit.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApplicationEditComponent implements OnInit, OnDestroy {

  private destroyed = new Subject();
  public application$: Observable<ApplicationModel | null> = of(null);

  constructor(
    private route: ActivatedRoute,
    private store$: Store,
    private router: Router,
    private applicationTreeService: ApplicationTreeService,
  ) {
    this.route.paramMap.pipe(
      takeUntil(this.destroyed),
      map(params => params.get('applicationId')),
      distinctUntilChanged(),
      filter((appId): appId is string => !!appId),
    ).subscribe(appId => {
      this.applicationTreeService.setSelectedApplication(appId);
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

  protected readonly RoutesEnum = RoutesEnum;
}
