import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Optional, Output, TemplateRef, ViewChild, inject } from '@angular/core';
import { FormControl, ValidatorFn, Validators, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, filter } from 'rxjs/operators';
import { Subscription, takeUntil } from 'rxjs';
import { ColorHelper } from '../../helpers/color.helper';
import { PopoverService } from '../../services/popover/popover.service';
import { OverlayRef } from '../../services/overlay/overlay-ref';
import { BrowserHelper } from '../../helpers';
import { PopoverPositionEnum } from '../../services';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatFormField, MatLabel, MatError, MatSuffix } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { TooltipDirective } from '../../directives/tooltip.directive';

const colorDefinitions: Array<[string, string]> = [
  [ 'rgb(136, 14, 79)', $localize`:@@shared.color-picker.color.dark-pink:Dark pink` ],
  [ 'rgb(165, 39, 20)', $localize`:@@shared.color-picker.color.dark-red-brown:Dark red brown` ],
  [ 'rgb(170, 0, 0)', $localize`:@@shared.color-picker.color.dark-red:Dark red` ],
  [ 'rgb(230, 81, 0)', $localize`:@@shared.color-picker.color.dark-orange:Dark orange` ],
  [ 'rgb(249, 168, 37)', $localize`:@@shared.color-picker.color.amber:Amber` ],
  [ 'rgb(255, 214, 0)', $localize`:@@shared.color-picker.color.yellow:Yellow` ],
  [ 'rgb(129, 119, 23)', $localize`:@@shared.color-picker.color.olive:Olive` ],
  [ 'rgb(85, 139, 47)', $localize`:@@shared.color-picker.color.green:Green` ],
  [ 'rgb(9, 113, 56)', $localize`:@@shared.color-picker.color.dark-green:Dark green` ],
  [ 'rgb(0, 96, 100)', $localize`:@@shared.color-picker.color.teal:Teal` ],
  [ 'rgb(1, 87, 155)', $localize`:@@shared.color-picker.color.dark-blue:Dark blue` ],
  [ 'rgb(26, 35, 126)', $localize`:@@shared.color-picker.color.navy:Navy` ],
  [ 'rgb(103, 58, 183)', $localize`:@@shared.color-picker.color.purple:Purple` ],
  [ 'rgb(78, 52, 46)', $localize`:@@shared.color-picker.color.dark-brown:Dark brown` ],
  [ 'rgb(194, 24, 91)', $localize`:@@shared.color-picker.color.pink:Pink` ],
  [ 'rgb(255, 82, 82)', $localize`:@@shared.color-picker.color.coral-red:Coral red` ],
  [ 'rgb(204, 0, 0)', $localize`:@@shared.color-picker.color.red:Red` ],
  [ 'rgb(245, 124, 0)', $localize`:@@shared.color-picker.color.orange:Orange` ],
  [ 'rgb(251, 192, 45)', $localize`:@@shared.color-picker.color.golden-yellow:Golden yellow` ],
  [ 'rgb(255, 234, 0)', $localize`:@@shared.color-picker.color.bright-yellow:Bright yellow` ],
  [ 'rgb(175, 180, 43)', $localize`:@@shared.color-picker.color.yellow-green:Yellow green` ],
  [ 'rgb(124, 179, 66)', $localize`:@@shared.color-picker.color.light-green:Light green` ],
  [ 'rgb(15, 157, 88)', $localize`:@@shared.color-picker.color.medium-green:Medium green` ],
  [ 'rgb(0, 151, 167)', $localize`:@@shared.color-picker.color.cyan:Cyan` ],
  [ 'rgb(2, 136, 209)', $localize`:@@shared.color-picker.color.blue:Blue` ],
  [ 'rgb(57, 73, 171)', $localize`:@@shared.color-picker.color.indigo:Indigo` ],
  [ 'rgb(156, 39, 176)', $localize`:@@shared.color-picker.color.violet:Violet` ],
  [ 'rgb(121, 85, 72)', $localize`:@@shared.color-picker.color.brown:Brown` ],
  [ 'rgb(244, 143, 177)', $localize`:@@shared.color-picker.color.light-pink:Light pink` ],
  [ 'rgb(237, 162, 155)', $localize`:@@shared.color-picker.color.salmon:Salmon` ],
  [ 'rgb(234, 153, 153)', $localize`:@@shared.color-picker.color.light-red:Light red` ],
  [ 'rgb(255, 204, 128)', $localize`:@@shared.color-picker.color.light-orange:Light orange` ],
  [ 'rgb(250, 218, 128)', $localize`:@@shared.color-picker.color.light-amber:Light amber` ],
  [ 'rgb(255, 255, 141)', $localize`:@@shared.color-picker.color.light-yellow:Light yellow` ],
  [ 'rgb(230, 238, 156)', $localize`:@@shared.color-picker.color.yellow-lime:Yellow lime` ],
  [ 'rgb(197, 225, 165)', $localize`:@@shared.color-picker.color.pale-green:Pale green` ],
  [ 'rgb(135, 206, 172)', $localize`:@@shared.color-picker.color.mint:Mint` ],
  [ 'rgb(178, 235, 242)', $localize`:@@shared.color-picker.color.light-cyan:Light cyan` ],
  [ 'rgb(161, 194, 250)', $localize`:@@shared.color-picker.color.light-blue:Light blue` ],
  [ 'rgb(159, 168, 218)', $localize`:@@shared.color-picker.color.periwinkle:Periwinkle` ],
  [ 'rgb(206, 147, 216)', $localize`:@@shared.color-picker.color.lavender:Lavender` ],
  [ 'rgb(188, 170, 164)', $localize`:@@shared.color-picker.color.rosy-brown:Rosy brown` ],
  [ 'rgb(255, 255, 255)', $localize`:@@shared.color-picker.color.white:White` ],
  [ 'rgb(189, 189, 189)', $localize`:@@shared.color-picker.color.light-grey:Light grey` ],
  [ 'rgb(117, 117, 117)', $localize`:@@shared.color-picker.color.grey:Grey` ],
  [ 'rgb(66, 66, 66)', $localize`:@@shared.color-picker.color.dark-grey:Dark grey` ],
  [ 'rgb(0, 0, 0)', $localize`:@@shared.color-picker.color.black:Black` ],
];

const defaultColors: Array<string | undefined> = colorDefinitions.map(([color]) => color);
const colorLabels = new Map<string, string>(colorDefinitions);

@Component({
    selector: 'tm-color-picker',
    templateUrl: './color-picker.component.html',
    styleUrls: ['./color-picker.component.css'],
    imports: [
        MatButton,
        MatIcon,
        MatFormField,
        MatLabel,
        MatInput,
        ReactiveFormsModule,
        MatError,
        MatSuffix,
        MatIconButton,
        TooltipDirective,
    ],
})
export class ColorPickerComponent implements OnInit, OnDestroy {
  private popper = inject(PopoverService);


  @ViewChild('colorPickerButton', { static: false, read: ElementRef })
  private colorPickerButton: ElementRef<HTMLButtonElement> | null = null;

  @ViewChild('colorPickerContent', { static: false, read: TemplateRef })
  private colorPickerContent: TemplateRef<any> | null = null;

  @Input()
  public color: string | undefined;

  @Output()
  public colorChange = new EventEmitter<string>();

  @Optional() @Input()
  public class = '';

  @Input()
  public toggleFormat: 'circle' | 'line' | 'polygon' | 'text' = 'polygon';

  @Input()
  public allowEmptyColor = false;

  @Input()
  public dropdownPosition: PopoverPositionEnum | undefined;

  public pickerOpen = false;

  public sortedColors: Array<string | undefined> = [];

  private subscription = new Subscription();

  public formControl = new FormControl('', { nonNullable: true });

  private popoverRef: OverlayRef | undefined;

  private preferredWindowWidth = 515;

  public ngOnInit(): void {
    const validators: ValidatorFn[] = [
      ColorHelper.colorValidator(this.allowEmptyColor),
    ];
    if (!this.allowEmptyColor) {
      validators.push(Validators.required);
    }
    this.formControl.setValidators(validators);
    this.formControl.patchValue(this.color || '');
    const colorChange$ = this.formControl.valueChanges
      .pipe(debounceTime(250), filter(val => val !== '' && ColorHelper.isValidColor(val, this.allowEmptyColor)))
      .subscribe((val: string) => this.colorChange.emit(val));

    this.subscription.add(colorChange$);
  }

  public getPickerColors(): Array<string | undefined> {
    if (BrowserHelper.getScreenWith() > this.preferredWindowWidth) {
      if (this.allowEmptyColor) {
        return defaultColors.concat(undefined);
      }
      return defaultColors;
    }
    if (this.sortedColors.length !== 0) {
      return this.sortedColors;
    }
    // When we have a small screen we sort the colors by luminosity
    const colors: Array<string | undefined> = [...defaultColors];
    if (this.allowEmptyColor) {
      colors.push(undefined);
    }
    const sumColor = (str: string | undefined) => {
      if (str === undefined) {
        return 1000;
      }
      // https://stackoverflow.com/questions/27960722/sort-array-with-rgb-color-on-javascript
      const rgb = str.replace(/[rgb()]/g, '').split(',').map(Number);
      return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
    };
    colors.sort((c1, c2) => {
      const sumC1 = sumColor(c1);
      const sumC2 = sumColor(c2);
      return sumC1 === sumC2 ? 0 : sumC1 > sumC2 ? 1 : -1;
    });
    this.sortedColors = colors;
    return this.sortedColors;
  }

  public ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  public hasError() {
    return this.formControl.invalid && (this.formControl.dirty || this.formControl.touched);
  }

  public isRequired() {
    return this.formControl.errors ? !!this.formControl.errors['required'] : false;
  }

  public openPicker() {
    if (this.popoverRef) {
      this.popoverRef.close();
    }
    if (!this.colorPickerButton || !this.colorPickerContent) {
      return;
    }
    this.popoverRef = this.popper.open({
      origin: this.colorPickerButton.nativeElement,
      content: this.colorPickerContent,
      position: this.dropdownPosition || PopoverPositionEnum.TOP_LEFT_UP,
      height: 235,
      width: Math.min(this.preferredWindowWidth, BrowserHelper.getScreenWith()),
      closeOnClickOutside: true,
    });
    const overlayKeydownSub = this.popoverRef.overlay.keydownEvents()
      .pipe(takeUntil(this.popoverRef.afterClosed$))
      .subscribe((ev: KeyboardEvent) => {
        if (ev.key === 'Escape' || ev.key === 'Esc') {
          ev.preventDefault();
          ev.stopPropagation();
          this.popoverRef?.close();
        }
      });
    this.subscription.add(overlayKeydownSub);
    setTimeout(() => {
      const firstBtn: HTMLButtonElement | null = document.querySelector('.color-picker__color');
      if (firstBtn) {
        firstBtn.focus();
      }
    });
  }

  public getClass() {
    const cls =  ['color-picker'];
    if (this.class) {
      cls.push(this.class);
    }
    if (this.hasError()) {
      cls.push('color-picker--has-error');
    }
    return cls;
  }

  public selectColor(color: string | undefined) {
    this.formControl.setValue(color || '');
    this.pickerOpen = false;
    this.colorChange.emit(color);
    this.popoverRef?.close();
  }

  public hasInvalidColorError() {
    if (!this.formControl.errors) {
      return false;
    }
    return this.hasError()
      && !this.isRequired()
      && !!this.formControl.errors['invalidColor'];
  }

  public getInvalidColorMessage() {
    const err = this.formControl.errors ? this.formControl.errors['invalidColor'] : null;
    if (!err) {
      return '';
    }
    return err.message;
  }

  public copyToClipboard() {
    if (!this.color) {
      return;
    }
    navigator.clipboard.writeText(this.color!).then(() => {});
  }

  public getColorLabel(color: string | undefined): string {
    if (!color) {
      return $localize`:@@shared.color-picker.no-color:No color`;
    }
    const colorLabel = colorLabels.get(color) ?? color;
    return $localize`:@@shared.color-picker.pick:Pick ${colorLabel}`;
  }
}
