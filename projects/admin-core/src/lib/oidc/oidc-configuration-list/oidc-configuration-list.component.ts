import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { OIDCConfigurationModel } from '@tailormap-admin/admin-api';
import { distinctUntilChanged, map, Observable, of, Subject, take, takeUntil, combineLatest } from 'rxjs';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { clearSelectedOIDCConfiguration, setOIDCConfigurationListFilter } from '../state/oidc-configuration.actions';
import {
  selectOIDCConfigurationList, selectOIDCConfigurationListFilter, selectOIDCConfigurationsLoadError, selectOIDCConfigurationsLoadStatus,
  selectSelectedOIDCConfigurationId,
} from '../state/oidc-configuration.selectors';
import { LoadingStateEnum, ErrorMessageComponent } from '@tailormap-viewer/shared';
import { OIDCConfigurationService } from '../services/oidc-configuration.service';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatButton } from '@angular/material/button';
import { ListFilterComponent } from '../../shared/components/list-filter/list-filter.component';
import { MatSelectionList, MatListItem } from '@angular/material/list';
import { RouterLink } from '@angular/router';
import { AsyncPipe } from '@angular/common';

@Component({
    selector: 'tm-admin-oidc-configuration-list',
    templateUrl: './oidc-configuration-list.component.html',
    styleUrls: ['./oidc-configuration-list.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        MatProgressSpinner,
        ErrorMessageComponent,
        MatButton,
        ListFilterComponent,
        ReactiveFormsModule,
        MatSelectionList,
        MatListItem,
        RouterLink,
        AsyncPipe,
    ],
})
export class OIDCConfigurationListComponent implements OnInit, OnDestroy {
  private store$ = inject(Store);
  private oidcConfigurationService = inject(OIDCConfigurationService);


  public filter = new FormControl('');
  public filterTerm$ = this.store$.select(selectOIDCConfigurationListFilter);
  public oidcConfigurations$: Observable<Array<OIDCConfigurationModel & { selected: boolean }>> = of([]);
  public oidcConfigurationsLoadStatus$: Observable<LoadingStateEnum> = of(LoadingStateEnum.INITIAL);
  public errorMessage$: Observable<string | undefined> = of(undefined);

  private destroyed = new Subject();

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
          this.oidcConfigurationService.loadOIDCConfigurations();
        }
      });
  }

  public ngOnDestroy(): void {
    this.store$.dispatch(clearSelectedOIDCConfiguration());
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  public onRetryClick() {
    this.oidcConfigurationService.loadOIDCConfigurations();
  }

}
