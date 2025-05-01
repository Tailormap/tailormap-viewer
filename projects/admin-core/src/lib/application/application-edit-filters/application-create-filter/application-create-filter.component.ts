import { Component, ChangeDetectionStrategy, Signal } from '@angular/core';
import { AttributeFilterModel, FilterGroupModel } from '@tailormap-viewer/api';
import { Store } from '@ngrx/store';
import { createApplicationFilterGroup } from '../../state/application.actions';
import { selectSelectedApplicationId } from '../../state/application.selectors';

@Component({
  selector: 'tm-admin-application-create-filter',
  templateUrl: './application-create-filter.component.html',
  styleUrls: ['./application-create-filter.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ApplicationCreateFilterComponent {

  private filterGroup: FilterGroupModel<AttributeFilterModel> | null = null;

  public formValid: boolean = true;

  public applicationId: Signal<string | null | undefined> = this.store$.selectSignal(selectSelectedApplicationId);

  constructor(private store$: Store) { }

  public save() {
    if (!this.filterGroup) {
      return;
    }
    this.store$.dispatch(createApplicationFilterGroup({ filterGroup: this.filterGroup }));
  }

  public updateFilter($event: FilterGroupModel<AttributeFilterModel>) {
    this.filterGroup = $event;
  }

  public validFormChanged($event: boolean) {
    this.formValid = $event;
  }
}
