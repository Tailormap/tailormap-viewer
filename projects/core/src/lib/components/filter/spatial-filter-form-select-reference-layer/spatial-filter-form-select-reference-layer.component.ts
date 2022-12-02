import { Component, OnInit, ChangeDetectionStrategy, inject, OnDestroy } from '@angular/core';
import { Observable, of, Subject } from 'rxjs';
import { AppLayerModel } from '@tailormap-viewer/api';
import { Store } from '@ngrx/store';
import { selectReferencableLayers, selectReferenceLayer } from '../state/filter-component.selectors';
import { FormControl } from '@angular/forms';
import { takeUntil } from 'rxjs/operators';
import { setReferenceLayer } from '../state/filter-component.actions';

@Component({
  selector: 'tm-spatial-filter-form-select-reference-layer',
  templateUrl: './spatial-filter-form-select-reference-layer.component.html',
  styleUrls: ['./spatial-filter-form-select-reference-layer.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpatialFilterFormSelectReferenceLayerComponent implements OnInit, OnDestroy {

  private destroyed = new Subject();
  private store$ = inject(Store);

  public availableLayers$: Observable<AppLayerModel[]> = of([]);
  public referenceLayerControl = new FormControl<number | undefined>(undefined, {
    nonNullable: true,
  });

  constructor() { }

  public ngOnInit(): void {
    this.availableLayers$ = this.store$.select(selectReferencableLayers);
    this.store$.select(selectReferenceLayer)
      .pipe(takeUntil(this.destroyed))
      .subscribe((layer) => {
        this.referenceLayerControl.patchValue(layer, { emitEvent: false });
      });
    this.referenceLayerControl.valueChanges
      .pipe(takeUntil(this.destroyed))
      .subscribe((value) => {
        this.store$.dispatch(setReferenceLayer({ layer: value }));
      });
  }

  public ngOnDestroy(): void {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

}
