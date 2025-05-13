import { Component, OnInit, ChangeDetectionStrategy, Input } from '@angular/core';
import { AttributeType, FilterConditionEnum } from '@tailormap-viewer/api';
import { Observable } from 'rxjs';
import { InputFilterData } from '@tailormap-viewer/shared';

@Component({
  selector: 'tm-admin-application-checkbox-filter-form',
  templateUrl: './application-checkbox-filter-form.component.html',
  styleUrls: ['./application-checkbox-filter-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ApplicationCheckboxFilterFormComponent implements OnInit {

  public _filterData: InputFilterData = {
    condition: FilterConditionEnum.UNIQUE_VALUES_KEY,
    value: undefined,
    caseSensitive: undefined,
    invertCondition: undefined,
  };

  @Input()
  public attributeType: AttributeType = AttributeType.STRING;

  @Input()
  public uniqueValues$: Observable<string[]> | null = null;

  constructor() { }

  public ngOnInit(): void {
    return;
  }

  public updateFilter(_filter: {
    condition: FilterConditionEnum;
    value: string[];
    caseSensitive?: boolean;
    invertCondition?: boolean;
  }) {
    return;
  }

}
