import { Component, OnInit, ChangeDetectionStrategy, Input, forwardRef, DestroyRef, inject } from '@angular/core';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'tm-admin-list-filter',
  templateUrl: './list-filter.component.html',
  styleUrls: ['./list-filter.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ListFilterComponent),
      multi: true,
    },
  ],
  standalone: false,
})
export class ListFilterComponent implements OnInit, ControlValueAccessor {
  private destroyRef = inject(DestroyRef);


  @Input()
  public label: string = '';

  private _filterTerm: string | null | undefined;

  @Input()
  public set filterTerm(filterTerm: string | null | undefined) {
    this._filterTerm = filterTerm;
    this.filterControl.patchValue(filterTerm ?? null, { emitEvent: false });
  }
  public get filterTerm() {
    return this._filterTerm;
  }

  public filterControl = new FormControl('');

  public disabled = false;
  private onChange: any | null = null;
  private onTouched: any | null = null;

  public ngOnInit(): void {
    this.filterControl.valueChanges
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        distinctUntilChanged(),
        debounceTime(250),
      )
      .subscribe(filterTerm => {
        this.valueChanged(filterTerm);
      });
  }

  public writeValue(_filterTerm: string | null): void {
  }

  public registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  public registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  public setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled;
    if (isDisabled) {
      this.filterControl.disable({ emitEvent: false });
    } else {
      this.filterControl.enable({ emitEvent: false });
    }
  }

  private valueChanged(value: string | null) {
    if (this.onChange) {
      this.onChange(value);
    }
  }

  public clearFilter() {
    this.filterControl.patchValue('', { emitEvent: false });
    this.valueChanged('');
  }
}
