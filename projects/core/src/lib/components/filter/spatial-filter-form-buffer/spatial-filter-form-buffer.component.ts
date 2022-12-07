import { Component, OnInit, ChangeDetectionStrategy, inject, OnDestroy } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Store } from '@ngrx/store';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { selectBuffer } from '../state/filter-component.selectors';
import { SpatialFilterCrudService } from '../services/spatial-filter-crud.service';

@Component({
  selector: 'tm-spatial-filter-form-buffer',
  templateUrl: './spatial-filter-form-buffer.component.html',
  styleUrls: ['./spatial-filter-form-buffer.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpatialFilterFormBufferComponent implements OnInit, OnDestroy {

  private destroyed = new Subject();
  private store$ = inject(Store);
  private filterCrudService = inject(SpatialFilterCrudService);

  public bufferControl = new FormControl<number>(0, {
    nonNullable: true,
  });

  public ngOnInit(): void {
    this.store$.select(selectBuffer)
      .pipe(takeUntil(this.destroyed))
      .subscribe((buffer) => {
        this.bufferControl.patchValue(buffer || 0, { emitEvent: false });
      });
    this.bufferControl.valueChanges
      .pipe(takeUntil(this.destroyed), debounceTime(250))
      .subscribe((value) => {
        this.filterCrudService.updateBuffer(this.getBufferValue(value));
      });
  }

  private getBufferValue(buffer: number | undefined): number | undefined {
    if (!buffer || buffer === 0 || isNaN(+(buffer))) {
      return undefined;
    }
    return +(buffer);
  }

  public ngOnDestroy(): void {
    this.destroyed.next(null);
    this.destroyed.complete();
  }

}
