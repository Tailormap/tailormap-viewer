import { ChangeDetectionStrategy, Component, computed, input, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { AttributeType, FilterConditionEnum } from '@tailormap-viewer/api';
import { AttributeFilterHelper } from '@tailormap-viewer/shared';

@Component({
  selector: 'tm-admin-application-slider-filter-form',
  templateUrl: './application-slider-filter-form.component.html',
  styleUrls: ['./application-slider-filter-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ApplicationSliderFilterFormComponent implements OnInit {

  public attributeType = input<AttributeType>(AttributeType.INTEGER);
  public filterConditions = computed(() => {
    const attributeType = this.attributeType();
    return AttributeFilterHelper.getConditionTypes().filter(c => c.attributeType.length === 0 || c.attributeType.includes(attributeType));
  });

  constructor() { }

  public sliderFilterForm = new FormGroup({
    condition: new FormControl<FilterConditionEnum | null>(null),
    initialValue: new FormControl<number | null>(null),
    minimumValue: new FormControl<number | null>(null),
    maximumValue: new FormControl<number | null>(null),
  });

  public ngOnInit(): void {
    return;
  }

}
