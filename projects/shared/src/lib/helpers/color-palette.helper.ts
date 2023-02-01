/**
 * Most code is borrowed from https://github.com/johannesjo/angular-material-css-vars
 * Author: Johannes Millan and contributors
 */

import { Numberify, RGBA, TinyColor } from '@ctrl/tinycolor';

export class ColorPaletteHelper {

  private static readonly CONTRAST_PREFIX = 'contrast-';
  public static readonly PRIMARY_PREFIX = '--palette-primary-';
  public static readonly ACCENT_PREFIX = '--palette-accent-';
  private static readonly DARK_TEXT_VAR = '--dark-primary-text';
  private static readonly LIGHT_TEXT_VAR = '--light-primary-text';
  private static readonly PALETTE_HUES = [ '50',  '100',  '200',  '300',  '400',  '500',  '600',
    '700',  '800',  '900',  'A100',  'A200',  'A400',  'A700' ];

  public static createPalette(primaryColor: string) {
    const primaryPalette = ColorPaletteHelper.computePaletteColors(ColorPaletteHelper.PRIMARY_PREFIX, primaryColor);
    // We base the accent color on the 300 hue of the primary color
    const hue300Color = ColorPaletteHelper.getNameForHue(ColorPaletteHelper.PRIMARY_PREFIX, '300');
    const accentColor = primaryPalette.find((color) => color.name === hue300Color);
    if (accentColor) {
      const accentPalette = ColorPaletteHelper.computePaletteColors(ColorPaletteHelper.ACCENT_PREFIX, accentColor.val);
      return [ ...primaryPalette, ...accentPalette ];
    }
    return primaryPalette;
  }

  public static getNameForHue(palettePrefix: string, hue: string) {
    return `${palettePrefix}${hue}`;
  }

  private static computePaletteColors(palettePrefix: string, hex: string) {
    return ColorPaletteHelper.getConstantinPaletteForColor(hex).map(item => {
      const textVariable = item.isLight ? ColorPaletteHelper.DARK_TEXT_VAR : ColorPaletteHelper.LIGHT_TEXT_VAR;
      return [{
        name: ColorPaletteHelper.getNameForHue(palettePrefix, item.hue),
        val: `rgb(${item.color.r}, ${item.color.g}, ${item.color.b})`,
      }, {
        name: `${palettePrefix}${ColorPaletteHelper.CONTRAST_PREFIX}${item.hue}`,
        val: `var(${textVariable})`,
      }];
    }).flat();
  }

  private static getConstantinPaletteForColor(hex: string) {
    return ColorPaletteHelper.PALETTE_HUES.map(hue => {
      const c = ColorPaletteHelper.computePalletTriad(hex, hue);
      return { hue, isLight: c.isLight(), color: c.toRgb() };
    });
  }

  /**
   * Compute pallet colors based on a Triad (Constantin)
   * see: https://github.com/mbitson/mcg
   */
  private static computePalletTriad(hex: string, hue: string): TinyColor {
    const baseLight = new TinyColor('#ffffff');
    const color = new TinyColor(hex);
    const baseDark = ColorPaletteHelper.multiply(color.toRgb(), color.toRgb());
    const baseTriad = color.tetrad();
    switch (hue) {
      case '50':
        return new TinyColor(baseLight.mix(hex, 12));
      case '100':
        return new TinyColor(baseLight.mix(hex, 30));
      case '200':
        return new TinyColor(baseLight.mix(hex, 50));
      case '300':
        return new TinyColor(baseLight.mix(hex, 70));
      case '400':
        return new TinyColor(baseLight.mix(hex, 85));
      case '500':
        return new TinyColor(baseLight.mix(hex, 100));
      case '600':
        return new TinyColor(baseDark.mix(hex, 87));
      case '700':
        return new TinyColor(baseDark.mix(hex, 70));
      case '800':
        return new TinyColor(baseDark.mix(hex, 54));
      case '900':
        return new TinyColor(baseDark.mix(hex, 25));
      case 'A100':
        return new TinyColor(baseDark.mix(baseTriad[4], 15).saturate(80).lighten(65));
      case 'A200':
        return new TinyColor(baseDark.mix(baseTriad[4], 15).saturate(80).lighten(55));
      case 'A400':
        return new TinyColor(baseDark.mix(baseTriad[4], 15).saturate(100).lighten(45));
      case 'A700':
        return new TinyColor(baseDark.mix(baseTriad[4], 15).saturate(100).lighten(40));
    }
    throw new Error(`Unknown hue: ${hue}`);
  }

  private static multiply(rgb1: Numberify<RGBA>, rgb2: Numberify<RGBA>): TinyColor {
    rgb1.b = Math.floor(rgb1.b * rgb2.b / 255);
    rgb1.g = Math.floor(rgb1.g * rgb2.g / 255);
    rgb1.r = Math.floor(rgb1.r * rgb2.r / 255);
    return new TinyColor('rgb ' + rgb1.r + ' ' + rgb1.g + ' ' + rgb1.b);
  }

}
