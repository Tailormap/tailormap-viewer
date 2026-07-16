import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { selectAttributeListTab } from '../state/attribute-list.selectors';
import { take } from 'rxjs';
import { AttributeListDataService } from '../services/attribute-list-data.service';

@Component({
  selector: 'tm-attribute-list-tab',
  templateUrl: './attribute-list-tab.component.html',
  styleUrls: ['./attribute-list-tab.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class AttributeListTabComponent {
  private store$ = inject(Store);
  private attributeListDataService = inject(AttributeListDataService);


  @Input()
  public set id (id: string | undefined) {
    if (id && this._id !== id) {
      this._id = id;
      this.loadDataIfNeeded(id);
    }
  }

  public get id(): string {
    return this._id;
  }

  private _id = '';

  private loadDataIfNeeded(id: string) {
    this.store$.select(selectAttributeListTab(id))
      .pipe(take(1))
      .subscribe(tab => {
        if (!tab || !tab.layerId || tab.initialDataLoaded) {
          return;
        }
        this.attributeListDataService.loadData(id);
      });
  }

}
