import { Component, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { selectSomeLayersVisible } from '../../../map/state/map.selectors';
import { Observable, of } from 'rxjs';
import { Store } from '@ngrx/store';
import { toggleAllLayersVisibility } from '../../../map/state/map.actions';

@Component({
  selector: 'tm-toggle-all-layers-button',
  templateUrl: './toggle-all-layers-button.component.html',
  styleUrls: ['./toggle-all-layers-button.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ToggleAllLayersButtonComponent implements OnInit {
  private store$ = inject(Store);


  public someLayersVisible$: Observable<boolean> = of(false);

  public ngOnInit(): void {
    this.someLayersVisible$ = this.store$.select(selectSomeLayersVisible);
  }

  public toggleAll() {
    this.store$.dispatch(toggleAllLayersVisibility());
  }

}
