import { ChangeDetectionStrategy, Component, DestroyRef, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import {
  EditFilterConfigurationModel, FilterConditionEnum, FilterToolEnum, UpdateTextFilterModel,
} from '@tailormap-viewer/api';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime } from 'rxjs/operators';
import { AttributeFilterHelper } from '@tailormap-viewer/shared';

@Component({
  selector: 'tm-admin-application-text-filter-form',
  templateUrl: './application-text-filter-form.component.html',
  styleUrls: ['./application-text-filter-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ApplicationTextFilterFormComponent implements OnInit {
  private destroyRef = inject(DestroyRef);

  public stringConditions = AttributeFilterHelper.getConditionTypes()
    .filter(c => c.condition === FilterConditionEnum.STRING_EQUALS_KEY
      || c.condition === FilterConditionEnum.STRING_LIKE_KEY);

  @Input()
  public set textFilterSettings(configuration: EditFilterConfigurationModel | null) {
    if (configuration && configuration.filterTool === FilterToolEnum.TEXT) {
      this.textFilterForm.patchValue({
        condition: configuration.condition,
        initialValue: configuration.initialText ?? '',
        caseSensitive: configuration.caseSensitive ?? false,
      }, { emitEvent: false });
    }
  }

  @Output()
  public updateTextFilter = new EventEmitter<UpdateTextFilterModel>();

  public textFilterForm = new FormGroup({
    condition: new FormControl<FilterConditionEnum>(FilterConditionEnum.STRING_LIKE_KEY),
    initialValue: new FormControl<string>(''),
    caseSensitive: new FormControl<boolean>(false),
  });

  public ngOnInit(): void {
    this.textFilterForm.valueChanges
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        debounceTime(250),
      )
      .subscribe(value => {
        this.updateTextFilter.emit({
          filterTool: FilterToolEnum.TEXT,
          condition: value.condition ?? FilterConditionEnum.STRING_LIKE_KEY,
          initialText: value.initialValue ?? undefined,
          caseSensitive: value.caseSensitive ?? false,
        });
      });
    // Emit initial value
    this.textFilterForm.updateValueAndValidity({ emitEvent: true });
  }

}
