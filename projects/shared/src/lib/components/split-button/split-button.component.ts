import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { SplitButtonOptionModel } from './split-button-option.model';

@Component({
  selector: 'tm-split-button',
  templateUrl: './split-button.component.html',
  styleUrls: ['./split-button.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
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

  @Input()
  public tooltip: string | undefined;

  @Input()
  public in3D: boolean = false;

  @Input()
  public layersWithoutWebMercator: string[] = [];

  public selectedOptionId: string | null = null;
  public selectedOptionObject: SplitButtonOptionModel | null = null;
  public optionsList: SplitButtonOptionModel[] = [];
  private nextOption: SplitButtonOptionModel | null = null;

  public cycleNextOption() {
    if (this.optionsList.length === 0) {
      return;
    }
    const idx = this.optionsList.findIndex(o => o.id === this.selectedOptionId);
    const nextIdx = idx === -1 ? 0 : (idx + 1) % this.optionsList.length;
    this.selectedOptionId = this.optionsList[nextIdx].id;
    this.setSelectedOption();
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
      const idx = this.optionsList.findIndex(o => o.id === this.selectedOptionId);
      this.nextOption = idx !== -1 && this.optionsList.length > 1
        ? this.optionsList[(idx + 1) % this.optionsList.length]
        : null;
    }
  }

  public getLabel() {
    if (this.selectedOptionObject) {
      return this.selectedOptionObject.label;
    }
    return this.emptyLabel || '';
  }

  public getNextLabel(): string {
    const nextLabel = this.nextOption?.label;
    if (!nextLabel) {
      return '';
    }
    return $localize`:@@core.background-layer-toggle.show-next-option:Show ${nextLabel}:NEXT_LABEL:`;
  }

  public isLayerHiddenOnMap(option: SplitButtonOptionModel) {
    return this.in3D && this.layersWithoutWebMercator.includes(option.id);
  }

}
