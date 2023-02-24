import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Store } from '@ngrx/store';
import { loadData } from '../state/attribute-list.actions';
import { selectAttributeListTab } from '../state/attribute-list.selectors';
import { take } from 'rxjs';

@Component({
  selector: 'tm-attribute-list-tab',
  templateUrl: './attribute-list-tab.component.html',
  styleUrls: ['./attribute-list-tab.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttributeListTabComponent {

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

  constructor(
    private store$: Store,
  ) {}

  private loadDataIfNeeded(id: string) {
    this.store$.select(selectAttributeListTab(id))
      .pipe(take(1))
      .subscribe(tab => {
        if (!tab || !tab.layerName || tab.initialDataLoaded) {
          return;
        }
        this.store$.dispatch(loadData({ tabId: id }));
      });
  }

}
