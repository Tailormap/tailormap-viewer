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
  public selectedTabIdx$: Observable<number> = of(0);

  private subRoutes = [
    { idx: 0, path: '' },
    { idx: 1, path: RoutesEnum.APPLICATION_DETAILS_LAYERS },
  ];

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
    this.selectedTabIdx$ = this.route.url
      .pipe(
        distinctUntilChanged(),
        map(() => {
          const url = this.route.snapshot.children.length > 0 ? this.route.snapshot.children[0].url.map(segment => segment.path).join('/') : '';
          const idx = this.subRoutes.find(subRoute => subRoute.path === url)?.idx || -1;
          return idx !== -1 ? idx : 0;
        }),
      );
    this.application$ = this.store$.select(selectSelectedApplication);
  }

  public ngOnInit(): void {
  }

  public ngOnDestroy(): void {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  public navigateTo(appId: string, tabIdx: number) {
    const url = [
      RoutesEnum.APPLICATION,
      RoutesEnum.APPLICATION_DETAILS.replace(':applicationId', appId),
    ];
    this.subRoutes.forEach(subRoute => {
      if (tabIdx === subRoute.idx && subRoute.path) {
        url.push(subRoute.path);
      }
    });
    this.router.navigateByUrl(url.join('/'));
  }

}
