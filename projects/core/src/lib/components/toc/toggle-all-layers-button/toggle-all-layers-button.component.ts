import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { selectAllLayersVisible } from '../../../map/state/map.selectors';
import { Observable, of } from 'rxjs';
import { Store } from '@ngrx/store';
import { toggleAllLayersVisibility } from '../../../map/state/map.actions';

@Component({
  selector: 'tm-toggle-all-layers-button',
  templateUrl: './toggle-all-layers-button.component.html',
  styleUrls: ['./toggle-all-layers-button.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToggleAllLayersButtonComponent implements OnInit {

  public allChecked$: Observable<boolean> = of(false);

  constructor(
    private store$: Store,
  ) { }

  public ngOnInit(): void {
    this.allChecked$ = this.store$.select(selectAllLayersVisible);
  }

  public toggleAll() {
    this.store$.dispatch(toggleAllLayersVisibility());
  }

}
