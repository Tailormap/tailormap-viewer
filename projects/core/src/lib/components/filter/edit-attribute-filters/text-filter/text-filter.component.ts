import { ChangeDetectionStrategy, Component, DestroyRef, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { AttributeFilterModel, FilterToolEnum } from '@tailormap-viewer/api';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime } from 'rxjs/operators';
import { AttributeFilterHelper } from '@tailormap-viewer/shared';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';

@Component({
    selector: 'tm-text-filter',
    templateUrl: './text-filter.component.html',
    styleUrls: ['./text-filter.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        MatFormField,
        MatLabel,
        MatInput,
        ReactiveFormsModule,
    ],
})
export class TextFilterComponent implements OnInit {
  private destroyRef = inject(DestroyRef);

  public label: string = '';

  public textControl = new FormControl<string>('');

  @Input()
  public set textFilter(filter: AttributeFilterModel) {
    if (filter.editConfiguration?.filterTool !== FilterToolEnum.TEXT) {
      return;
    }
    const conditionLabel = AttributeFilterHelper.getConditionTypes(false)
      .find(c => c.condition === filter.condition)?.label || '';
    this.label = $localize `:@@core.filter.text-filter.label:Filter: ${filter.attribute} ${conditionLabel} - value`;
    this.textControl.setValue(filter.value[0], { emitEvent: false });
  }

  @Output()
  public valueChange = new EventEmitter<string>();

  public ngOnInit(): void {
    this.textControl.valueChanges
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        debounceTime(300),
      )
      .subscribe(value => {
        this.valueChange.emit(value ?? '');
      });
  }
}
