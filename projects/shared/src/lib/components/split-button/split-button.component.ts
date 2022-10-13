import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { SplitButtonOptionModel } from './split-button-option.model';

@Component({
  selector: 'tm-split-button',
  templateUrl: './split-button.component.html',
  styleUrls: ['./split-button.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SplitButtonComponent {

  @Input()
  public set options(options: SplitButtonOptionModel[] | null) {
    if (options !== null) {
      this.optionsList = options;
      this.setSelectedOption();
    }
  }

  @Input()
  public set selectedOption (selectedOption: string | null | undefined) {
    if (selectedOption === null || typeof selectedOption === 'undefined') {
      return;
    }
    this.selectedOptionId = selectedOption;
    this.setSelectedOption();
  }

  @Input()
  public emptyLabel: string | null = null;

  @Output()
  public optionSelected = new EventEmitter<string>();

  @Input()
  public small_screens_icon: string | undefined;

  public selectedOptionId: string | null = null;
  public selectedOptionObject: SplitButtonOptionModel | null = null;
  public optionsList: SplitButtonOptionModel[] = [];

  constructor() { }

  public cycleNextOption() {
    const idx = this.optionsList.findIndex(o => o.id === this.selectedOptionId);
    let nextIdx = idx + 1;
    if (idx === -1 || nextIdx === this.optionsList.length) {
      nextIdx = 0;
    }
    this.selectedOptionId = this.optionsList[nextIdx].id;
    this.selectedOptionObject = this.optionsList[nextIdx];
    this.optionSelected.emit(this.selectedOptionId);
  }

  public selectOption(id: string) {
    this.selectedOptionId = id;
    this.setSelectedOption();
    this.optionSelected.emit(id);
  }

  public setSelectedOption() {
    if (this.optionsList.length > 0) {
      this.selectedOptionObject = this.optionsList.find(o => o.id === this.selectedOptionId) || null;
    }
  }

  public getLabel() {
    if (this.selectedOptionObject) {
      return this.selectedOptionObject.label;
    }
    return this.emptyLabel || '';
  }

}
