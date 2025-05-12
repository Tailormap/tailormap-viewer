import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { FilterConditionEnum } from '@tailormap-viewer/api';

@Component({
  selector: 'tm-admin-application-slider-filter-form',
  templateUrl: './application-slider-filter-form.component.html',
  styleUrls: ['./application-slider-filter-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ApplicationSliderFilterFormComponent implements OnInit {

  constructor() { }

  public sliderFilterForm = new FormGroup({
    condition: new FormControl<FilterConditionEnum | null>(null),
    minimumValue: new FormControl<number | null>(null),
    maximumValue: new FormControl<number | null>(null),
  });

  public ngOnInit(): void {
    return;
  }

}
