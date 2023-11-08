import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Store } from '@ngrx/store';
import { distinctUntilChanged, map, Observable, of, switchMap, take } from 'rxjs';
import { selectDraftApplication } from '../state/application.selectors';
import { ApplicationModel } from '@tailormap-admin/admin-api';
import { updateDraftApplication } from '../state/application.actions';
import { ConfigService } from '../../config/services/config.service';
import { UpdateDraftApplicationModel } from '../models/update-draft-application.model';

@Component({
  selector: 'tm-admin-application-edit-settings',
  templateUrl: './application-edit-settings.component.html',
  styleUrls: ['./application-edit-settings.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApplicationEditSettingsComponent implements OnInit {

  public application$: Observable<ApplicationModel | null> = of(null);
  public isDefaultApplication$: Observable<boolean> = of(false);

  constructor(
    private store$: Store,
    private configService: ConfigService,
  ) { }

  public ngOnInit(): void {
    this.application$ = this.store$.select(selectDraftApplication)
      .pipe(
        distinctUntilChanged((a, b) => {
          return a?.id === b?.id;
        }),
      );
    this.isDefaultApplication$ = this.application$
      .pipe(
        switchMap(a => {
          return this.configService.getConfigValue$(ConfigService.DEFAULT_APPLICATION_KEY)
            .pipe(
              map(defaultApplication => defaultApplication === a?.name),
            );
        }),
      );
  }

  public updateApplication($event: UpdateDraftApplicationModel) {
    this.store$.dispatch(updateDraftApplication($event));
  }

  public toggleDefaultApplication(applicationName: string) {
    this.configService.saveConfig$({
      key: ConfigService.DEFAULT_APPLICATION_KEY,
      value: applicationName,
      jsonValue: null,
    }).pipe(take(1)).subscribe();
  }

}
