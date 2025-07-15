import { Component, OnInit, ChangeDetectionStrategy, Input, EventEmitter, Output } from '@angular/core';
import { DropdownListFilterModel } from '@tailormap-viewer/api';

@Component({
  selector: 'tm-dropdown-list-filter',
  templateUrl: './dropdown-list-filter.component.html',
  styleUrls: ['./dropdown-list-filter.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class DropdownListFilterComponent implements OnInit {

  @Input()
  public dropdownListFilterConfiguration: DropdownListFilterModel | null = null;

  @Input()
  public uniqueValues: string[] | null = null;

  @Output()
  public valueSelected = new EventEmitter<{ value: string, selected: boolean }>();

  constructor() { }

  public ngOnInit(): void {
  }

}
