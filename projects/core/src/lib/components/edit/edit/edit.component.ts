import { Component, OnInit, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { selectEditActive, selectSelectedEditLayer } from '../state/edit.selectors';
import { Store } from '@ngrx/store';
import { combineLatest, take } from 'rxjs';
import { setEditActive, setSelectedEditLayer } from '../state/edit.actions';
import { FormControl } from '@angular/forms';
import { selectEditableLayers } from '../../../map/state/map.selectors';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { withLatestFrom } from 'rxjs/operators';

@Component({
  selector: 'tm-edit',
  templateUrl: './edit.component.html',
  styleUrls: ['./edit.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditComponent implements OnInit {

  public active$ = this.store$.select(selectEditActive);
  public editableLayers$ = this.store$.select(selectEditableLayers);
  public layer = new FormControl();

  constructor(
    private store$: Store,
    private destroyRef: DestroyRef,
  ) { }

  public ngOnInit(): void {
    this.store$.select(selectSelectedEditLayer)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(layer => {
        this.layer.setValue(layer, { emitEvent: false });
      });
    this.layer.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(layer => {
        this.store$.dispatch(setSelectedEditLayer({ layer }));
      });
    combineLatest([
      this.active$,
      this.editableLayers$,
    ])
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        withLatestFrom(this.store$.select(selectSelectedEditLayer)),
      )
      .subscribe(([[ active, editableLayers ], selectedLayer ]) => {
        if (active && editableLayers.length === 1 && !selectedLayer) {
          this.store$.dispatch(setSelectedEditLayer({ layer: editableLayers[0].id }));
        }
      });
  }

  public toggle(close?: boolean) {
    if (close) {
      this.store$.dispatch(setEditActive({ active: false }));
      return;
    }
    this.store$.select(selectEditActive)
      .pipe(take(1))
      .subscribe(active => {
        this.store$.dispatch(setEditActive({ active: !active }));
      });
  }

}
