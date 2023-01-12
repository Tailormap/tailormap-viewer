import { MapBookmarkHelper } from './bookmark.helper';
import { AppLayerModel, getAppLayerModel } from '@tailormap-viewer/api';
import { MapViewDetailsModel, MapUnitEnum } from '@tailormap-viewer/map';
import { TristateBoolean, LayerVisibilityBookmarkFragment } from './bookmark_pb';
import { AppLayerWithInitialValuesModel } from '../models';

const getAppLayerWithInitialValuesModel =
  (partial: Partial<AppLayerModel>, initialVisibility?: boolean, initialOpacity?: number): AppLayerWithInitialValuesModel => {
    const model = getAppLayerModel(partial);
    return {
      ...model,
      initialValues: { visible: initialVisibility ?? model.visible, opacity: initialOpacity ?? model.opacity },
    };
  };

const initialLayers = [
  getAppLayerWithInitialValuesModel({ id: 1, visible: true }),
  getAppLayerWithInitialValuesModel({ id: 2, visible: false }),
  getAppLayerWithInitialValuesModel({ id: 3, visible: true }),
  getAppLayerWithInitialValuesModel({ id: 9, visible: true }),
  getAppLayerWithInitialValuesModel({ id: 256, visible: false }),
  getAppLayerWithInitialValuesModel({ id: 512, visible: true }),
];

const twoFlippedLayers = [
  getAppLayerWithInitialValuesModel({ id: 1, visible: true }, false),
  getAppLayerWithInitialValuesModel({ id: 2, visible: false }, true),
  getAppLayerWithInitialValuesModel({ id: 3, visible: true }),
  getAppLayerWithInitialValuesModel({ id: 9, visible: true }),
  getAppLayerWithInitialValuesModel({ id: 256, visible: false }),
  getAppLayerWithInitialValuesModel({ id: 512, visible: true }),
];

const allFlippedLayers = [
  getAppLayerWithInitialValuesModel({ id: 1, visible: true }, false),
  getAppLayerWithInitialValuesModel({ id: 2, visible: false }, true),
  getAppLayerWithInitialValuesModel({ id: 3, visible: true }, false),
  getAppLayerWithInitialValuesModel({ id: 9, visible: true }, false),
  getAppLayerWithInitialValuesModel({ id: 256, visible: false }, true),
  getAppLayerWithInitialValuesModel({ id: 512, visible: true }, false),
];


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


  test('visibilityDataFromFragment generates expected data', () => {
    expect(MapBookmarkHelper.visibilityDataFromFragment(new LayerVisibilityBookmarkFragment({
        layers: [
            { relativeId: 1, visible: TristateBoolean.FALSE },
            { relativeId: (256 - 1 - 1), visible: TristateBoolean.TRUE },
        ],
    }), initialLayers)).toEqual({ visibilityChanges: [{ id: 1, checked: false }, { id: 256, checked: true }], opacityChanges: [] });
  });

  test('visibilityDataFromFragment skips unknown IDs', () => {
    expect(MapBookmarkHelper.visibilityDataFromFragment(new LayerVisibilityBookmarkFragment({
        layers: [
            { relativeId: 4, visible: TristateBoolean.TRUE },
        ],
    }), initialLayers)).toEqual({ visibilityChanges: [], opacityChanges: [] });
  });

  test('visibilityDataFromFragment skips unset bookmarks', () => {
    expect(MapBookmarkHelper.visibilityDataFromFragment(new LayerVisibilityBookmarkFragment({
        layers: [
            { relativeId: 1, visible: TristateBoolean.UNSET },
            { relativeId: (256 - 1 - 1), visible: TristateBoolean.TRUE },
        ],
    }), initialLayers)).toEqual({ visibilityChanges: [{ id: 256, checked: true }], opacityChanges: [] });
  });

  test('visibilityDataFromFragment does not change already-changed visibility flags', () => {
    expect(MapBookmarkHelper.visibilityDataFromFragment(new LayerVisibilityBookmarkFragment({
        layers: [
            { relativeId: 1, visible: TristateBoolean.TRUE },
        ],
    }), initialLayers)).toEqual({ visibilityChanges: [], opacityChanges: [] });
  });

  test('visibilityDataFromFragment resets layers back to initial value when not referenced', () => {
    expect(MapBookmarkHelper.visibilityDataFromFragment(new LayerVisibilityBookmarkFragment({
    }), twoFlippedLayers)).toEqual({ visibilityChanges: [{ id: 1, checked: false }, { id: 2, checked: true }], opacityChanges: [] });
  });

  test('fragmentFromVisibilityData serializes changes', () => {
    expect(MapBookmarkHelper.fragmentFromVisibilityData(initialLayers)).toEqual(new LayerVisibilityBookmarkFragment());
    expect(MapBookmarkHelper.fragmentFromVisibilityData(twoFlippedLayers)).toEqual(new LayerVisibilityBookmarkFragment({
        layers: [
            { relativeId: 1, visible: TristateBoolean.TRUE },
            { relativeId: 0, visible: TristateBoolean.FALSE },
        ],
    }));
    expect(MapBookmarkHelper.fragmentFromVisibilityData(allFlippedLayers)).toEqual(new LayerVisibilityBookmarkFragment({
        layers: [
            { relativeId: 1, visible: TristateBoolean.TRUE },
            { relativeId: (2 - 1 - 1), visible: TristateBoolean.FALSE },
            { relativeId: (3 - 2 - 1), visible: TristateBoolean.TRUE },
            { relativeId: (9 - 3 - 1), visible: TristateBoolean.TRUE },
            { relativeId: (256 - 9 - 1), visible: TristateBoolean.FALSE },
            { relativeId: (512 - 256 - 1), visible: TristateBoolean.TRUE },
        ],
    }));
  });
});
