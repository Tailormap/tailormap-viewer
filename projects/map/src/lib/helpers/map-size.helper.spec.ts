import { MapSizeHelper } from './map-size.helper';

describe('MapSizeHelper', () => {

  test('get the formatted length', () => {
    expect(MapSizeHelper.getFormattedLength()).toEqual('');
    expect(MapSizeHelper.getFormattedLength(100)).toEqual('100 m');
    expect(MapSizeHelper.getFormattedLength(10)).toEqual('10 m');
    expect(MapSizeHelper.getFormattedLength(101)).toEqual('0.1 km');
    expect(MapSizeHelper.getFormattedLength(1201)).toEqual('1.2 km');
    expect(MapSizeHelper.getFormattedLength(50000)).toEqual('50 km');
  });

  test('get the formatted area', () => {
    expect(MapSizeHelper.getFormattedArea()).toEqual('');
    expect(MapSizeHelper.getFormattedArea(100)).toEqual('100 m');
    expect(MapSizeHelper.getFormattedArea(10000)).toEqual('10000 m');
    expect(MapSizeHelper.getFormattedArea(10001)).toEqual('0.01 km');
    expect(MapSizeHelper.getFormattedArea(50000)).toEqual('0.05 km');
    expect(MapSizeHelper.getFormattedArea(5000000)).toEqual('5 km');
  });

});
