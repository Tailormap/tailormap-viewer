import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { BehaviorSubject, Observable } from 'rxjs';
import { PopoverPositionEnum } from '@tailormap-viewer/shared';
import { ViewerStylingModel } from '@tailormap-viewer/api';
import { selectStylingConfig } from '../state/application.selectors';
import { updateApplicationStylingConfig } from '../state/application.actions';
import { UploadCategoryEnum } from '../../shared/components/select-upload/models/upload-category.enum';

@Component({
  selector: 'tm-admin-application-edit-styling',
  templateUrl: './application-edit-styling.component.html',
  styleUrls: ['./application-edit-styling.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApplicationEditStylingComponent {

  public stylingConfig$: Observable<ViewerStylingModel | undefined> = new BehaviorSubject<ViewerStylingModel>({});

  public DEFAULT_PRIMARY_COLOR = 'rgb(98, 54, 255)';
  public dropdownPosition = PopoverPositionEnum.BOTTOM_LEFT_DOWN;
  public appLogoCategory = UploadCategoryEnum.APPLICATION_LOGO;

  constructor(
    private store$: Store,
  ) {
    this.stylingConfig$ = this.store$.select(selectStylingConfig);
  }

  private updateStyling(styling: ViewerStylingModel) {
    this.store$.dispatch(updateApplicationStylingConfig({ styling }));
  }

  public onPrimaryColorChange($event: string) {
    this.updateStyling({ primaryColor: $event });
  }

  public onImageChanged($event: string | null) {
    this.updateStyling({ logo: $event });
  }

}
