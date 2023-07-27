import { Component, OnInit, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { selectEditActive, selectSelectedEditLayer } from '../state/edit.selectors';
import { Store } from '@ngrx/store';
import { combineLatest, take } from 'rxjs';
import { setEditActive, setSelectedEditLayer } from '../state/edit.actions';
import { FormControl } from '@angular/forms';
import { selectEditableLayers } from '../../../map/state/map.selectors';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { withLatestFrom } from 'rxjs/operators';
import { selectUserDetails } from "../../../state/core.selectors";
import { hideFeatureInfoDialog } from "../../feature-info/state/feature-info.actions";

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

  private defaultTooltip = $localize `Edit feature`;
  private notLoggedInTooltip = $localize `You must be logged in to edit.`;
  private noLayersTooltip = $localize `There are no editable layers. Enable a layer to start editing.`;

  public tooltip = this.defaultTooltip;
  public disabled = false;

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
      this.store$.select(selectUserDetails),
    ])
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        withLatestFrom(this.store$.select(selectSelectedEditLayer)),
      )
      .subscribe(([[ active, editableLayers, userDetails ], selectedLayer ]) => {
        this.toggleTooltipDisabled(userDetails.isAuthenticated, editableLayers.length);
        if (active && editableLayers.length === 1 && !selectedLayer) {
          this.store$.dispatch(setSelectedEditLayer({ layer: editableLayers[0].id }));
        }
        if (active && editableLayers.length === 0) {
          this.toggle(true);
        }
      });
  }

  private toggleTooltipDisabled(isAuthenticated: boolean, editableLayerCount: number) {
    if (!isAuthenticated) {
      this.tooltip = this.notLoggedInTooltip;
      this.disabled = true;
      return;
    }
    if (editableLayerCount === 0) {
      this.tooltip = this.noLayersTooltip;
      this.disabled = true;
      return;
    }
    this.tooltip = this.defaultTooltip;
    this.disabled = false;
  }

  public toggle(close?: boolean) {
    if (close) {
      this.store$.dispatch(setEditActive({ active: false }));
      return;
    }
    this.store$.select(selectEditActive)
      .pipe(take(1))
      .subscribe(active => {
        const editActive = !active; // toggle
        this.store$.dispatch(setEditActive({ active: editActive }));
        if (editActive) {
          this.store$.dispatch(hideFeatureInfoDialog());
        }
      });
  }

}
