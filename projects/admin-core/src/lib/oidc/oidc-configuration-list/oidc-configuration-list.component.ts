import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { OIDCConfigurationModel } from '@tailormap-admin/admin-api';
import { distinctUntilChanged, map, Observable, of, Subject, take, takeUntil, combineLatest } from 'rxjs';
import { FormControl } from '@angular/forms';
import { Store } from '@ngrx/store';
import { clearSelectedOIDCConfiguration, loadOIDCConfigurations, setOIDCConfigurationListFilter } from '../state/oidc-configuration.actions';
import {
  selectOIDCConfigurationList, selectOIDCConfigurationsLoadError, selectOIDCConfigurationsLoadStatus, selectSelectedOIDCConfigurationId,
} from '../state/oidc-configuration.selectors';
import { ActivatedRoute, Router } from '@angular/router';
import { LoadingStateEnum } from '@tailormap-viewer/shared';
import { environment } from '../../../../../admin-app/src/environments/environment';
import { ConfigService } from '../../config/services/config.service';

@Component({
  selector: 'tm-admin-oidc-configuration-list',
  templateUrl: './oidc-configuration-list.component.html',
  styleUrls: ['./oidc-configuration-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OIDCConfigurationListComponent implements OnInit, OnDestroy {

  public filter = new FormControl('');
  public oidcConfigurations$: Observable<Array<OIDCConfigurationModel & { selected: boolean }>> = of([]);
  public oidcConfigurationsLoadStatus$: Observable<LoadingStateEnum> = of(LoadingStateEnum.INITIAL);
  public errorMessage$: Observable<string | undefined> = of(undefined);

  public viewerBaseUrl = environment.viewerBaseUrl;

  private destroyed = new Subject();

  constructor(
    private store$: Store,
    private route: ActivatedRoute,
    private router: Router,
    private configService: ConfigService,
  ) {}

  public ngOnInit(): void {
    this.filter.valueChanges
      .pipe(takeUntil(this.destroyed))
      .subscribe(value => {
        this.store$.dispatch(setOIDCConfigurationListFilter({ filter: value }));
      });
    this.oidcConfigurationsLoadStatus$ = this.store$.select(selectOIDCConfigurationsLoadStatus);
    this.errorMessage$ = this.store$.select(selectOIDCConfigurationsLoadError);
    this.oidcConfigurations$ = combineLatest([
      this.store$.select(selectOIDCConfigurationList),
      this.store$.select(selectSelectedOIDCConfigurationId).pipe(distinctUntilChanged()),
    ])
      .pipe(
        distinctUntilChanged(),
        map(([ oidcConfigurations, selectedOIDCConfigurationId ]) => {
          return oidcConfigurations.map(a => ({
            ...a,
            selected: a.id === selectedOIDCConfigurationId,
          })).sort((a, b) => {
            return a.name.toLocaleLowerCase()
              .localeCompare(b.name.toLocaleLowerCase());
          });
        }),
    );
    this.oidcConfigurationsLoadStatus$
      .pipe(take(1))
      .subscribe(loadStatus => {
        if (loadStatus === LoadingStateEnum.INITIAL || loadStatus === LoadingStateEnum.FAILED) {
          this.store$.dispatch(loadOIDCConfigurations());
        }
      });
  }

  public ngOnDestroy(): void {
    this.store$.dispatch(clearSelectedOIDCConfiguration());
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  public onRetryClick() {
    this.store$.dispatch(loadOIDCConfigurations());
  }

  public stopPropagation(event: Event) {
    event.stopPropagation();
  }

}
