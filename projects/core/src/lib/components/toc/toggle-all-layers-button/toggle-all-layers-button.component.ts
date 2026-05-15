import { Component, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { combineLatest, map, Observable, of } from 'rxjs';
import { Store } from '@ngrx/store';
import { toggleAllLayersVisibility } from '../../../map/state/map.actions';
import { selectFilterEnabled, selectFilterTerm, selectSomeLayersVisibleInToc } from '../state/toc.selectors';
import { take } from 'rxjs/operators';

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
  public toggleAllLayersTooltip$: Observable<string> = of('');

  public ngOnInit(): void {
    this.someLayersVisible$ = this.store$.select(selectSomeLayersVisibleInToc);
    this.toggleAllLayersTooltip$ = this.someLayersVisible$.pipe(
      map(visible => visible
        ? $localize `:@@core.toc.toggle-layers-off:Toggle all layers off`
        : $localize `:@@core.toc.toggle-layers-on:Toggle all layers on`),
    );
  }

  public toggleAll() {
    combineLatest([
      this.store$.select(selectFilterEnabled),
      this.store$.select(selectFilterTerm),
    ])
      .pipe(take(1))
      .subscribe(([ filterEnabled, filterTerm ]) => {
        this.store$.dispatch(toggleAllLayersVisibility({ filterTerm: filterEnabled ? filterTerm : undefined }));
      });
  }

}
