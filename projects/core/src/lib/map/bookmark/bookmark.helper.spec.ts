import { MapBookmarkHelper } from './bookmark.helper';
import { MapViewDetailsModel, MapUnitEnum } from '@tailormap-viewer/map';

const mapViewDetails: MapViewDetailsModel = {
  zoomLevel: 0,
  minZoomLevel: 0,
  maxZoomLevel: 21,
  resolution: 0,
  scale: 0,
  minResolution: 0,
  maxResolution: 0,
  size: undefined,
  center: undefined,
  extent: null,
};

const mapViewDetailsWithCoordinates = {
    ...mapViewDetails,
    center: [ 1234.5678, 5678.9012 ],
    zoomLevel: 98.76,
};

const mapViewDetailsWithNegativeCoordinates = {
    ...mapViewDetails,
    center: [ -1234.5678, -5678.9012 ],
    zoomLevel: 98.76,
};

const mapViewDetailsWithDegreeCoordinates = {
    ...mapViewDetails,
    center: [ 1.23456789, 5.67890123 ],
    zoomLevel: 98.76,
};

describe('MapBookmarkHelper', () => {
  test('deserializes coordinate fragments', () => {
    expect(MapBookmarkHelper.locationAndZoomFromFragment('1234.56,5678.90,12.3', mapViewDetails, MapUnitEnum.m)).toEqual([[ 1234.56, 5678.90 ], 12.3 ]);
    expect(MapBookmarkHelper.locationAndZoomFromFragment('1234.56, 5678.90, 12.3', mapViewDetails, MapUnitEnum.m)).toEqual([[ 1234.56, 5678.90 ], 12.3 ]);

    expect(MapBookmarkHelper.locationAndZoomFromFragment('-1234.56,-5678.90,12.3', mapViewDetails, MapUnitEnum.m)).toEqual([[ -1234.56, -5678.90 ], 12.3 ]);
    expect(MapBookmarkHelper.locationAndZoomFromFragment('1.23456789,5.678901,12.3', mapViewDetails, MapUnitEnum.degrees)).toEqual([[ 1.23456789, 5.678901 ], 12.3 ]);
  });

  test('does not cause coordinate jitter', () => {
    expect(MapBookmarkHelper.locationAndZoomFromFragment('1234.57,5678.90,12.3', mapViewDetailsWithCoordinates, MapUnitEnum.m)).toEqual([[ 1234.5678, 5678.9012 ], 12.3 ]);
    expect(MapBookmarkHelper.locationAndZoomFromFragment('-1234.57,-5678.90,98.8', mapViewDetailsWithCoordinates, MapUnitEnum.m)).toEqual([[ -1234.57, -5678.90 ], 98.76 ]);
    // coordinates match exactly, so no changes are needed
    expect(MapBookmarkHelper.locationAndZoomFromFragment('1234.57,5678.90,98.8', mapViewDetailsWithCoordinates, MapUnitEnum.m)).toBeUndefined();

    expect(MapBookmarkHelper.locationAndZoomFromFragment('-1234.57,-5678.90,12.3', mapViewDetailsWithNegativeCoordinates, MapUnitEnum.m))
      .toEqual([[ -1234.5678, -5678.9012 ], 12.3 ]);
    expect(MapBookmarkHelper.locationAndZoomFromFragment('1.234568,5.678901,12.3', mapViewDetailsWithDegreeCoordinates, MapUnitEnum.degrees))
      .toEqual([[ 1.23456789, 5.67890123 ], 12.3 ]);
  });
  test('locationAndZoomFromFragment discards invalid inputs', () => {
    expect(MapBookmarkHelper.locationAndZoomFromFragment('12345', mapViewDetails, MapUnitEnum.m)).toBeUndefined();
    expect(MapBookmarkHelper.locationAndZoomFromFragment('1,2,3,4', mapViewDetails, MapUnitEnum.m)).toBeUndefined();
    expect(MapBookmarkHelper.locationAndZoomFromFragment('1,2', mapViewDetails, MapUnitEnum.m)).toBeUndefined();
    expect(MapBookmarkHelper.locationAndZoomFromFragment('Infinity,0,0', mapViewDetails, MapUnitEnum.m)).toBeUndefined();
    expect(MapBookmarkHelper.locationAndZoomFromFragment('1234fivesix,NaN,NaN', mapViewDetails, MapUnitEnum.m)).toBeUndefined();
  });

  test('fragmentFromLocationAndZoom works', () => {
    expect(MapBookmarkHelper.fragmentFromLocationAndZoom(mapViewDetails, MapUnitEnum.m)).toBeUndefined();
    expect(MapBookmarkHelper.fragmentFromLocationAndZoom(mapViewDetailsWithCoordinates, MapUnitEnum.m)).toEqual('1234.57,5678.90,98.8');
    expect(MapBookmarkHelper.fragmentFromLocationAndZoom(mapViewDetailsWithNegativeCoordinates, MapUnitEnum.m)).toEqual('-1234.57,-5678.90,98.8');
    expect(MapBookmarkHelper.fragmentFromLocationAndZoom(mapViewDetailsWithDegreeCoordinates, MapUnitEnum.degrees)).toEqual('1.234568,5.678901,98.8');
  });
});
