import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { loadData } from '../state/attribute-list.actions';
import { selectAttributeListTab } from '../state/attribute-list.selectors';
import { take } from 'rxjs';

@Component({
  selector: 'tm-attribute-list-tab',
  templateUrl: './attribute-list-tab.component.html',
  styleUrls: ['./attribute-list-tab.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class AttributeListTabComponent {
  private store$ = inject(Store);


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
        this.store$.dispatch(loadData({ tabId: id }));
      });
  }

}
