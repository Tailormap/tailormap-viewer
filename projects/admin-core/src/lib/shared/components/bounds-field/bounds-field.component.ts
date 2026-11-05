import { Component, forwardRef, inject, input, output, signal, linkedSignal, effect, untracked } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { disabled, form, FormField } from '@angular/forms/signals';
import { BoundsModel } from '@tailormap-viewer/api';
import { AdminProjectionsHelper } from '../../../application/helpers/admin-projections-helper';
import { ClipboardHelper, TooltipDirective } from '@tailormap-viewer/shared';
import { MatLabel, MatFormField } from '@angular/material/form-field';
import { MatButton } from '@angular/material/button';
import { MatInput } from '@angular/material/input';
import { MatIcon } from '@angular/material/icon';
import { Clipboard } from '@angular/cdk/clipboard';

interface BoundsFormValue {
  minx: number | null;
  miny: number | null;
  maxx: number | null;
  maxy: number | null;
}

const EMPTY_BOUNDS: BoundsFormValue = { minx: null, miny: null, maxx: null, maxy: null };

const toFormValue = (bounds: BoundsModel | null): BoundsFormValue => {
  if (!bounds) {
    return { ...EMPTY_BOUNDS };
  }
  return { minx: bounds.minx, miny: bounds.miny, maxx: bounds.maxx, maxy: bounds.maxy };
};

@Component({
  selector: 'tm-admin-bounds-form-field',
  templateUrl: './bounds-field.component.html',
  styleUrls: ['./bounds-field.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => BoundsFieldComponent),
      multi: true,
    },
  ],
  imports: [
    FormField,
    MatLabel,
    MatButton,
    MatFormField,
    MatInput,
    MatIcon,
    TooltipDirective,
  ],
})
export class BoundsFieldComponent implements ControlValueAccessor {
  private clipboard = inject(Clipboard);

  public bounds = input<BoundsModel | null>(null);
  public projection = input<string | null>(null);
  public label = input<string | null>(null);

  public changed = output<BoundsModel | null>();

  public disabled = signal(false);
  public copiedToClipboard = signal(false);

  /**
   * The value set from outside, either through the `bounds` input or through the
   * ControlValueAccessor `writeValue`. Changes to this value are never emitted back.
   */
  private externalValue = linkedSignal<BoundsFormValue>(() => toFormValue(this.bounds()));

  /**
   * The form model. Resets to the external value whenever that changes, and is updated by user edits.
   */
  private formValue = linkedSignal<BoundsFormValue>(() => this.externalValue());

  public boundsForm = form(this.formValue, path => {
    disabled(path, { when: this.disabled });
  });

  private onChange: ((value: BoundsModel | null) => void) | null = null;
  private onTouched: (() => void) | null = null;

  constructor() {
    // Emit changes made in this component (typing, pasting, clearing, ...). When the form value is
    // the exact same object as the external value, the change originated outside and is skipped.
    effect(() => {
      const value = this.formValue();
      if (value === untracked(this.externalValue)) {
        return;
      }
      untracked(() => this.triggerChange(value));
    });
  }

  public writeValue(obj: BoundsModel | null): void {
    this.externalValue.set(toFormValue(obj));
  }

  public registerOnChange(fn: (value: BoundsModel | null) => void): void {
    this.onChange = fn;
  }

  public registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  public setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  public setBoundsForProjection(projection: string | null) {
    if (!projection) {
      return;
    }
    const bounds = AdminProjectionsHelper.find(projection)?.bounds;
    if (bounds) {
      this.formValue.set(toFormValue(bounds));
    }
  }

  public parseInput($event: ClipboardEvent) {
    const bboxRegex = /minx="([-0-9.e+]+)" miny="([-0-9.e+]+)" maxx="([-0-9.e+]+)" maxy="([-0-9.e+]+)"/;
    const commaListRegex = /([-0-9.e+]+)\s*,\s*([-0-9.e+]+)\s*,\s*([-0-9.e+]+)\s*,\s*([-0-9.e+]+)/;
    const values = ClipboardHelper.parsePasteEvent($event, [ bboxRegex, commaListRegex ]);
    if (values && values.length === 5) {
      this.formValue.set({ minx: +values[1], miny: +values[2], maxx: +values[3], maxy: +values[4] });
    }
  }

  public clear() {
    this.formValue.set({ ...EMPTY_BOUNDS });
  }

  public markAsTouched() {
    this.onTouched?.();
  }

  public copyToClipboard() {
    const bounds = this.formValue();
    if (BoundsFieldComponent.isComplete(bounds)) {
      this.copiedToClipboard.set(this.clipboard.copy(`${bounds.minx}, ${bounds.miny}, ${bounds.maxx}, ${bounds.maxy}`));
      setTimeout(() => this.copiedToClipboard.set(false), 2000);
    }
  }

  private static isComplete(bounds: BoundsFormValue): bounds is { minx: number; miny: number; maxx: number; maxy: number } {
    return typeof bounds.minx === 'number'
      && typeof bounds.miny === 'number'
      && typeof bounds.maxx === 'number'
      && typeof bounds.maxy === 'number';
  }

  private valueChanged(value: BoundsModel | null) {
    this.onChange?.(value);
    this.changed.emit(value);
  }

  /**
   * Only emits when all fields are empty (null) or all fields contain a number; partially filled bounds are not emitted.
   */
  private triggerChange(bounds: BoundsFormValue) {
    if (bounds.minx === null
      && bounds.miny === null
      && bounds.maxx === null
      && bounds.maxy === null) {
      this.valueChanged(null);
    } else if (BoundsFieldComponent.isComplete(bounds)) {
      this.valueChanged({
        minx: bounds.minx,
        miny: bounds.miny,
        maxx: bounds.maxx,
        maxy: bounds.maxy,
        crs: this.projection() || undefined,
      });
    }
  }

}
