import { Component, ChangeDetectionStrategy, input, output, effect, signal } from '@angular/core';
import { AttachmentAttributeModel } from '@tailormap-admin/admin-api';
import { AbstractControl, FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { debounceTime } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CdkDragDrop } from '@angular/cdk/drag-drop';

@Component({
  selector: 'tm-admin-feature-type-attachment-attributes',
  templateUrl: './feature-type-attachment-attributes.component.html',
  styleUrls: ['./feature-type-attachment-attributes.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class FeatureTypeAttachmentAttributesComponent {

  public attachmentAttributes = input<AttachmentAttributeModel[]>([]);
  public attachmentAttributesChange = output<AttachmentAttributeModel[]>();

  public attachmentForm = new FormGroup({
    attributes: new FormArray([]),
  });
  public displayedColumns: string[] = [ 'attributeName', 'mimeType', 'maxAttachmentSize', 'actions', 'drag' ];
  public dataSource = new MatTableDataSource<any>();

  private isInitializing = false;
  public dragDropDisabled = signal(true);

  constructor() {
    this.attributes.valueChanges
      .pipe(debounceTime(300), takeUntilDestroyed())
      .subscribe(() => {
        if (!this.isInitializing) {
          this.emitChanges();
        }
      });

    this.attributes.valueChanges
      .pipe(debounceTime(100), takeUntilDestroyed())
      .subscribe(() => this.revalidateAttributeNames());

    effect(() => {
      const inputData = this.attachmentAttributes();
      this.initForm(inputData);
    });
  }


  public get attributes(): FormArray {
    return this.attachmentForm.get('attributes') as FormArray;
  }

  private initForm(inputData: AttachmentAttributeModel[]): void {
    this.isInitializing = true;

    // If input is empty, clear form and add one empty row
    if (!inputData || inputData.length === 0) {
      this.attributes.clear();
      this.attributes.push(this.createAttributeFormGroup());
      this.updateDataSource();
      setTimeout(() => {
        this.isInitializing = false;
      }, 0);
      return;
    }

    const inputAttributeNames = new Set(inputData.map(a => a.attributeName));
    const indicesToRemove: number[] = [];

    for (let i = 0; i < this.attributes.length; i++) {
      const formGroup = this.attributes.at(i) as FormGroup;
      const attributeName = formGroup.get('attributeName')?.value;
      if (!inputAttributeNames.has(attributeName)) {
        indicesToRemove.push(i);
      }
    }

    for (let i = indicesToRemove.length - 1; i >= 0; i--) {
      this.attributes.removeAt(indicesToRemove[i]);
    }

    // Update existing rows or add new ones
    inputData.forEach((attr, targetIndex) => {
      const existingFormGroup = this.attributes.controls.find(u => u.value.attributeName === attr.attributeName);
      if (existingFormGroup) {
        // Update existing row
        existingFormGroup.patchValue({
          mimeType: attr.mimeType,
          maxAttachmentSize: this.convertToMB(attr.maxAttachmentSize),
        }, { emitEvent: false });

        // Move to correct position if needed
        const currentIndex = this.attributes.controls.indexOf(existingFormGroup);
        if (currentIndex !== targetIndex && currentIndex !== -1) {
          const control = this.attributes.at(currentIndex);
          this.attributes.removeAt(currentIndex);
          this.attributes.insert(targetIndex, control);
        }
      } else {
        // Add new row at the correct position
        if (targetIndex < this.attributes.length) {
          this.attributes.insert(targetIndex, this.createAttributeFormGroup(attr));
        } else {
          this.attributes.push(this.createAttributeFormGroup(attr));
        }
      }
    });
    this.updateDataSource();
    setTimeout(() => {
      this.isInitializing = false;
    }, 0);
  }

  private createAttributeFormGroup(data?: AttachmentAttributeModel): FormGroup {
    return new FormGroup({
      attributeName: new FormControl(
        data?.attributeName || '',
        [ Validators.required, this.uniqueAttributeNameValidator.bind(this) ],
      ),
      mimeType: new FormControl(data?.mimeType || ''),
      maxAttachmentSize: new FormControl(this.convertToMB(data?.maxAttachmentSize) || null, [Validators.min(0)]),
    });
  }

  private uniqueAttributeNameValidator(control: AbstractControl): { [key: string]: any } | null {
    if (!control.value) {
      return null;
    }
    const currentValue = control.value.toLowerCase().trim();
    const formArray = this.attributes;
    if (!formArray) {
      return null;
    }
    const currentValues = formArray.controls.map(c => c.get('attributeName')?.value ?? '');
    const currentFieldsWithFieldValue = currentValues.filter(c => c.toLowerCase().trim() === currentValue);
    if (currentFieldsWithFieldValue.length > 1) {
      return { duplicate: true };
    }
    return null;
  }

  public addAttribute(): void {
    this.attributes.push(this.createAttributeFormGroup());
    this.updateDataSource();
    this.emitChanges();
  }

  public removeAttribute(index: number): void {
    this.attributes.removeAt(index);
    this.updateDataSource();
    this.revalidateAttributeNames();
    this.emitChanges();
  }

  public updateDataSource(): void {
    this.dataSource.data = this.attributes.controls;
  }

  public drop(event: CdkDragDrop<any[]>): void {
    const previousIndex = event.previousIndex;
    const currentIndex = event.currentIndex;
    if (previousIndex === currentIndex) {
      return;
    }
    const control = this.attributes.at(previousIndex);
    this.attributes.removeAt(previousIndex);
    this.attributes.insert(currentIndex, control);

    this.updateDataSource();
    this.emitChanges();
  }

  private revalidateAttributeNames(): void {
    for (let i = 0; i < this.attributes.length; i++) {
      const formGroup = this.attributes.at(i) as FormGroup;
      const attributeNameControl = formGroup.get('attributeName');
      attributeNameControl?.updateValueAndValidity({ emitEvent: false });
    }
  }

  private emitChanges(): void {
    if (!this.attachmentForm.valid) {
      return;
    }
    const formData: AttachmentAttributeModel[] = this.attributes.value;
    const filteredData = formData
      .filter(attr => {
        return attr.attributeName && attr.attributeName.trim() !== '';
      })
      .map(attr => ({
        ...attr,
        maxAttachmentSize: this.convertFromMB(attr.maxAttachmentSize),
      }));
    const currentInput = this.attachmentAttributes();
    if (this.hasChanges(filteredData, currentInput)) {
      this.attachmentAttributesChange.emit(filteredData);
    }
  }

  private hasChanges(newData: AttachmentAttributeModel[], currentData: AttachmentAttributeModel[]): boolean {
    if (newData.length !== currentData.length) {
      return true;
    }
    for (let i = 0; i < newData.length; i++) {
      const newAttr = newData[i];
      const currentAttr = currentData[i];
      if (
        newAttr.attributeName !== currentAttr.attributeName ||
        newAttr.mimeType !== currentAttr.mimeType ||
        newAttr.maxAttachmentSize !== currentAttr.maxAttachmentSize
      ) {
        return true;
      }
    }
    return false;
  }

  private convertToMB(size: number | null | undefined) {
    if (typeof size === 'undefined' || size === null) {
      return null;
    }
    return size / 1024 / 1024;
  }

  private convertFromMB(size: number | null | undefined) {
    if (typeof size === 'undefined' || size === null) {
      return null;
    }
    return size * 1024 * 1024;
  }

}
