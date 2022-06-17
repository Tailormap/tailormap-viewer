import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Store } from '@ngrx/store';
import { loadData } from '../state/attribute-list.actions';

@Component({
  selector: 'tm-attribute-list-tab',
  templateUrl: './attribute-list-tab.component.html',
  styleUrls: ['./attribute-list-tab.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttributeListTabComponent {

  @Input()
  public set id (id: string) {
    if (this._id !== id) {
      this.id = id;
      this.store$.dispatch(loadData({ tabId: id }));
    }
  }

  public get id() {
    return this._id;
  }

  private _id = '';

  constructor(
    private store$: Store,
  ) {}

}
