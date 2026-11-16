import { describe, test, expect } from 'vitest';
import { CadastralParcelSearchHelper } from './cadastral-parcel-search.helper';

describe('CadastralParcelSearchHelper', () => {

  test.each([
    // code form
    [ 'ATN02 K 2838', 'ATN02 K 2838' ],
    [ 'ATN02-K-2838', 'ATN02 K 2838' ],
    [ 'ATN02K2838', 'ATN02 K 2838' ],
    [ 'ATN02K02838', 'ATN02 K 2838' ],
    [ 'atn02-k-2838', 'ATN02 K 2838' ],
    [ '  ATN02   K   2838  ', 'ATN02 K 2838' ],
    [ 'ATN02 K 28', 'ATN02 K 28' ],
    [ 'ATN02 K', 'ATN02 K' ],
    [ 'ATN02K', 'ATN02 K' ],
    [ 'ASD04 AB 0', 'ASD04 AB 0' ],
    [ 'ATN02 K 2838 A 0001', 'ATN02 K 2838' ],
    [ 'ATN02K2838A0001', 'ATN02 K 2838' ],
    // name form
    [ 'Aalten K 2838', 'Aalten K 2838' ],
    [ 'Aalten K 02838', 'Aalten K 2838' ],
    [ 'aalten k 2838', 'aalten K 2838' ],
    [ 'Aalten-K-2838', 'Aalten K 2838' ],
    [ 'Aalten K 2838 A 0001', 'Aalten K 2838' ],
    [ "'s-Gravenhage AB 123", "'s-Gravenhage AB 123" ],
    [ 'Aalst Gelderland B 12', 'Aalst Gelderland B 12' ],
    // passed through unchanged
    [ 'Amsterdam', 'Amsterdam' ],
    [ 'Dorpsstraat 1', 'Dorpsstraat 1' ],
    [ 'Kerkstraat 1 A', 'Kerkstraat 1 A' ],
    [ '1234AB', '1234AB' ],
    [ '  Amsterdam  ', 'Amsterdam' ],
  ])('toParcelQuery(%j) returns %j', (input, expected) => {
    expect(CadastralParcelSearchHelper.toParcelQuery(input)).toBe(expected);
  });

  test('toLabel strips the "Perceel " prefix', () => {
    expect(CadastralParcelSearchHelper.toLabel('Perceel Aalten (ATN02) K 2838')).toBe('Aalten (ATN02) K 2838');
    expect(CadastralParcelSearchHelper.toLabel('Aalten (ATN02) K 2838')).toBe('Aalten (ATN02) K 2838');
  });

});
