import { Component, EventEmitter, Input, Optional, Output, ChangeDetectionStrategy } from '@angular/core';
import { CdkOverlayOrigin } from '@angular/cdk/overlay';
import { PopoverComponent } from '../popover/popover.component';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';

@Component({
    selector: 'tm-icon-picker',
    templateUrl: './icon-picker.component.html',
    styleUrls: ['./icon-picker.component.css'],
    // eslint-disable-next-line @angular-eslint/prefer-on-push-component-change-detection
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [ MatButton, MatIcon, CdkOverlayOrigin, PopoverComponent ],
})
export class IconPickerComponent {
  @Input()
  public icons: string[] = [];

  @Input()
  public selectedIcon = '';

  @Input()
  public iconColor = '';

  @Output()
  public iconChange = new EventEmitter<string>();

  @Optional() @Input()
  public class = '';

  public pickerOpen = false;

  public togglePicker() {
    this.pickerOpen = !this.pickerOpen;
  }

  public getClass() {
    const cls =  ['color-picker'];
    if (this.class) {
      cls.push(this.class);
    }
    return cls;
  }

  public selectIcon(icon: string) {
    this.pickerOpen = false;
    this.iconChange.emit(icon);
  }

  public getIconColor() {
    return this.iconColor || 'inherit';
  }
}
