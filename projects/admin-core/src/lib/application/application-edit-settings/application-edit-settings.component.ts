import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Store } from '@ngrx/store';
import { distinctUntilChanged, Observable, of } from 'rxjs';
import { selectDraftApplication } from '../state/application.selectors';
import { ApplicationModel } from '@tailormap-admin/admin-api';
import { updateDraftApplication } from '../state/application.actions';

@Component({
  selector: 'tm-admin-application-edit-settings',
  templateUrl: './application-edit-settings.component.html',
  styleUrls: ['./application-edit-settings.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApplicationEditSettingsComponent implements OnInit {

  public application$: Observable<ApplicationModel | null> = of(null);

  constructor(
    private store$: Store,
  ) { }

  public ngOnInit(): void {
    this.application$ = this.store$.select(selectDraftApplication)
      .pipe(
        distinctUntilChanged((a, b) => {
          return a?.id === b?.id;
        }),
      );
  }

  public updateApplication($event: Omit<ApplicationModel, 'id'>) {
    this.store$.dispatch(updateDraftApplication({ application: $event }));
  }

}
