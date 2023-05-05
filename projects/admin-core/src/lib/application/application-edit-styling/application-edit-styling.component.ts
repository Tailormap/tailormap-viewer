import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { BehaviorSubject, concatMap, Observable, of, take } from 'rxjs';
import { PopoverPositionEnum } from '@tailormap-viewer/shared';
import { ViewerStylingModel } from '@tailormap-viewer/api';
import { selectDraftApplication, selectStylingConfig } from '../state/application.selectors';
import { ApplicationService } from '../services/application.service';
import { clearSelectedApplication, updateApplicationStylingConfig } from '../state/application.actions';

@Component({
  selector: 'tm-admin-application-edit-styling',
  templateUrl: './application-edit-styling.component.html',
  styleUrls: ['./application-edit-styling.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApplicationEditStylingComponent {

  public stylingConfig$: Observable<ViewerStylingModel | undefined> = new BehaviorSubject<ViewerStylingModel>({});

  public hasChanges = false;

  private savingSubject = new BehaviorSubject(false);
  public saving$ = this.savingSubject.asObservable();

  public DEFAULT_PRIMARY_COLOR = 'rgb(98, 54, 255)';
  public dropdownPosition = PopoverPositionEnum.BOTTOM_LEFT_DOWN;

  constructor(
    private store$: Store,
    private applicationService: ApplicationService,
  ) {
    this.stylingConfig$ = this.store$.select(selectStylingConfig);
  }

  private updateStyling(styling: ViewerStylingModel) {
    this.store$.dispatch(updateApplicationStylingConfig({ styling }));
  }

  public clearSelectedApplication() {
    this.store$.dispatch(clearSelectedApplication());
  }

  public onPrimaryColorChange($event: string) {
    this.updateStyling({ primaryColor: $event });
  }

  public onImageChanged($event: string) {
    this.updateStyling({ logo: $event });
  }

  public save() {
    this.savingSubject.next(true);

    this.store$.select(selectDraftApplication)
      .pipe(
        take(1),
        concatMap(application => {
          if (!application) {
            return of(null);
          }
          return this.applicationService.updateApplication$(application.id, {
            styling: application.styling,
          });
        }),
      ).subscribe(() => {
        this.savingSubject.next(false);
      });
  }
}
