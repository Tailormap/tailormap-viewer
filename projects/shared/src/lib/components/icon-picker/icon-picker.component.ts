import { Component, ElementRef, EventEmitter, Input, Optional, Output, TemplateRef, ViewChild } from '@angular/core';
import { PopoverService } from '../../services/popover/popover.service';
import { OverlayRef } from '../../services/overlay/overlay-ref';

@Component({
  selector: 'tm-icon-picker',
  templateUrl: './icon-picker.component.html',
  styleUrls: ['./icon-picker.component.css'],
  standalone: false,
})
export class IconPickerComponent {

  @ViewChild('iconPickerButton', { static: false, read: ElementRef })
  private iconPickerButton: ElementRef<HTMLButtonElement> | undefined;

  @ViewChild('iconPickerContent', { static: false, read: TemplateRef })
  private iconPickerContent: TemplateRef<any> | undefined;

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

  private popoverRef: OverlayRef | undefined;

  constructor(private popper: PopoverService) {}

  public openPicker() {
    if (this.popoverRef) {
      this.popoverRef.close();
    }
    if (!this.iconPickerButton || !this.iconPickerContent) {
      return;
    }
    const ICON_SIZE = 24;
    const PADDING = 10;
    const TOGGLE_WIDTH = 51;
    this.popoverRef = this.popper.open({
      origin: this.iconPickerButton.nativeElement,
      content: this.iconPickerContent,
      height: ((ICON_SIZE + PADDING) * this.icons.length) + PADDING,
      width: TOGGLE_WIDTH,
      closeOnClickOutside: true,
    });
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
    this.popoverRef?.close();
  }

  public getIconColor() {
    return this.iconColor || 'inherit';
  }
}
