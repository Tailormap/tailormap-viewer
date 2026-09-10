import { Component, OnInit, ChangeDetectionStrategy, inject, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { Store } from '@ngrx/store';
import { selectSelectedLayers } from '../state/filter-component.selectors';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { takeUntil } from 'rxjs/operators';
import { SpatialFilterCrudService } from '../services/spatial-filter-crud.service';
import { FilterManagerService } from '../../../filter/services/filter-manager.service';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatSelect, MatOption } from '@angular/material/select';
import { AsyncPipe } from '@angular/common';

@Component({
    selector: 'tm-spatial-filter-form-select-layers',
    templateUrl: './spatial-filter-form-select-layers.component.html',
    styleUrls: ['./spatial-filter-form-select-layers.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        MatFormField,
        MatLabel,
        MatSelect,
        ReactiveFormsModule,
        MatOption,
        AsyncPipe,
    ],
})
export class SpatialFilterFormSelectLayersComponent implements OnInit, OnDestroy {

  private destroyed = new Subject();
  private store$ = inject(Store);
  private filterCrudService = inject(SpatialFilterCrudService);
  private filterManagerService = inject(FilterManagerService);

  public availableLayers$ = this.filterManagerService.filterableLayers$;
  public selectedLayersControl = new FormControl<string[]>([], {
    nonNullable: true,
  });

  public ngOnInit(): void {
    this.store$.select(selectSelectedLayers)
      .pipe(takeUntil(this.destroyed))
      .subscribe((layers) => {
        this.selectedLayersControl.patchValue(layers, { emitEvent: false });
      });
    this.selectedLayersControl.valueChanges
      .pipe(takeUntil(this.destroyed))
      .subscribe((value) => {
        this.filterCrudService.updateSelectedLayers(value || []);
      });
  }

  public ngOnDestroy(): void {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

}
