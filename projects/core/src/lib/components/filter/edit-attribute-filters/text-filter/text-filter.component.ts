import { ChangeDetectionStrategy, Component, DestroyRef, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { AttributeFilterModel, FilterToolEnum, TextFilterModel } from '@tailormap-viewer/api';
import { FormControl } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'tm-text-filter',
  templateUrl: './text-filter.component.html',
  styleUrls: ['./text-filter.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class TextFilterComponent implements OnInit {
  private destroyRef = inject(DestroyRef);

  public label: string = '';
  public textFilterConfiguration?: TextFilterModel;

  public textControl = new FormControl<string>('');

  @Input()
  public set textFilter(filter: AttributeFilterModel) {
    if (filter.editConfiguration?.filterTool !== FilterToolEnum.TEXT) {
      return;
    }
    this.textFilterConfiguration = filter.editConfiguration;
    this.label = filter.attributeAlias || filter.attribute;
    const currentValue = filter.value[0] ?? '';
    this.textControl.setValue(currentValue, { emitEvent: false });
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
