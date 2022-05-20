import { AbstractControl } from '@angular/forms';

const rgbRegex = /rgb\((\d{1,3}), (\d{1,3}), (\d{1,3})\)$/i;
const shorthandHexRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
const hexRegex = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i;
const defaultRgb = {r: 30, b: 30, g: 30}; // @TODO: Select default color?
const componentToHex = (c: number) => {
  const hex = c.toString(16);
  return hex.length === 1 ? '0' + hex : hex;
};

export class ColorHelper {

  public static getRgbForColor(color: string): { r: number; g: number; b: number } {
    if (!color) {
      return defaultRgb;
    }
    const rgbResult = rgbRegex.exec(color);
    if (rgbResult !== null) {
      return {r: parseInt(rgbResult[1], 10), g: parseInt(rgbResult[2], 10), b: parseInt(rgbResult[3], 10)};
    }
    color = color.replace(shorthandHexRegex, (m, r, g, b) => {
      return r + r + g + g + b + b;
    });
    const hexResult = hexRegex.exec(color);
    if (hexResult !== null) {
      return {
        r: parseInt(hexResult[1], 16),
        g: parseInt(hexResult[2], 16),
        b: parseInt(hexResult[3], 16),
      };
    }
    return defaultRgb;
  }

  public static getRgbStyleForColor(color: string, opacity?: number): string {
    const rgb = ColorHelper.getRgbForColor(color);
    if (typeof opacity !== 'undefined') {
      return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity / 100})`;
    }
    return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
  }

  public static isValidColor(color: string, allowEmpty?: boolean): boolean {
    if (allowEmpty && ColorHelper.isValidEmptyColor(color)) {
      return true;
    }
    return rgbRegex.test(color) || shorthandHexRegex.test(color) || hexRegex.test(color);
  }

  public static isValidEmptyColor(color: string | undefined) {
    return (typeof color === 'undefined' || color === '' || color === 'transparent');
  }

  public static colorValidator(allowEmpty?: boolean) {
    return (control: AbstractControl) => {
      if (allowEmpty && ColorHelper.isValidEmptyColor(control.value)) {
        return null;
      }
      return !ColorHelper.isValidColor('' + control.value, allowEmpty)
        ? {invalidColor: {message: 'Dit is een ongeldige kleur. Alleen hexadecimale kleuren of rgb codes zijn toegestaan'}}
        : null;
    };
  }

  public static rgbToHex(color: string) {
    const rgbResult = rgbRegex.exec(color);
    if (rgbResult !== null) {
      return [
        '#',
        componentToHex(parseInt(rgbResult[1], 10)),
        componentToHex(parseInt(rgbResult[2], 10)),
        componentToHex(parseInt(rgbResult[3], 10)),
      ].join('');
    }
    return color;
  }

}
