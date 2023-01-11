import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { debounceTime, map, Subject, take, takeUntil } from 'rxjs';
import { setFilterTerm } from '../state/toc.actions';
import { Store } from '@ngrx/store';
import { selectFilterTerm } from '../state/toc.selectors';

@Component({
  selector: 'tm-toc-filter-input',
  templateUrl: './toc-filter-input.component.html',
  styleUrls: ['./toc-filter-input.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TocFilterInputComponent implements OnInit, OnDestroy {

  public filterControl = new FormControl<string>('', { nonNullable: true });

  private destroyed = new Subject();
  constructor(
    private store$: Store,
  ) {
  }

  public ngOnDestroy() {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

  public ngOnInit(): void {
    this.store$.select(selectFilterTerm).pipe(
      take(1),
    ).subscribe(filterTerm => this.filterControl.setValue(filterTerm || ''));

    this.filterControl.valueChanges.pipe(
      takeUntil(this.destroyed),
      debounceTime(200),
      map(filterTerm => filterTerm.trim() === '' ? undefined : filterTerm),
    ).subscribe(filterTerm => this.store$.dispatch(setFilterTerm({ filterTerm })));
  }
}
