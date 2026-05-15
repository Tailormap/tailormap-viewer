import { OpenLayersSnappingManager } from './openlayers-snapping-manager';
import { Snap } from 'ol/interaction';
import { LayerTypesEnum } from '../models';
import { Style } from 'ol/style';
import { FeatureHelper } from '../helpers/feature.helper';

jest.mock('ol/interaction', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Snap: jest.fn(),
}));

const mockSnap = Snap as jest.MockedClass<typeof Snap>;
const getFeaturesFn = (FeatureHelper as any).getFeatures;

describe('OpenLayersSnappingManager', () => {
  let mockOlMap: { addInteraction: jest.Mock; removeInteraction: jest.Mock };
  let mockVectorSource: {
    getFeatures: jest.Mock;
    removeFeature: jest.Mock;
    addFeature: jest.Mock;
    getProjection: jest.Mock;
  };
  let mockVectorLayer: { getSource: jest.Mock; setStyle: jest.Mock };
  let mockLayerManager: { addLayer: jest.Mock; removeLayer: jest.Mock };
  let mockSnapInstance: { setProperties: jest.Mock };
  beforeEach(() => {
    jest.resetAllMocks();
    mockVectorSource = {
      getFeatures: jest.fn().mockReturnValue([]),
      removeFeature: jest.fn(),
      addFeature: jest.fn(),
      getProjection: jest.fn().mockReturnValue(null),
    };
    mockVectorLayer = {
      getSource: jest.fn().mockReturnValue(mockVectorSource),
      setStyle: jest.fn(),
    };
    mockLayerManager = {
      addLayer: jest.fn().mockReturnValue(mockVectorLayer),
      removeLayer: jest.fn(),
    };
    mockOlMap = {
      addInteraction: jest.fn(),
      removeInteraction: jest.fn(),
    };
    mockSnapInstance = { setProperties: jest.fn() };
    mockSnap.mockImplementation(() => mockSnapInstance as unknown as Snap);
    (FeatureHelper as any).getFeatures = jest.fn((features: unknown[]) => features);
  });

  afterEach(() => {
    // snappingAllowed is not reset by destroy(), so reset it explicitly
    (OpenLayersSnappingManager as any).snappingAllowed = false;
    OpenLayersSnappingManager.destroy();
    (FeatureHelper as any).getFeatures = getFeaturesFn;
  });

  const setup = ({ withLayer = false, withSnap = false } = {}) => {
    OpenLayersSnappingManager.init(mockOlMap as any, mockLayerManager as any);
    if (withLayer || withSnap) {
      OpenLayersSnappingManager.renderFeatures([]);
    }
    if (withSnap) {
      OpenLayersSnappingManager.allowSnapping(true);
      OpenLayersSnappingManager.enableSnappingIfAllowed(true);
    }
  };

  // ---------------------------------------------------------------------------
  // init
  // ---------------------------------------------------------------------------

  describe('init', () => {
    test('marks the manager as initialized', () => {
      OpenLayersSnappingManager.init(mockOlMap as any, mockLayerManager as any);
      expect((OpenLayersSnappingManager as any).initialized.value).toBe(true);
    });

    test('stores olMap and layerManager references', () => {
      OpenLayersSnappingManager.init(mockOlMap as any, mockLayerManager as any);
      expect((OpenLayersSnappingManager as any).olMap).toBe(mockOlMap);
      expect((OpenLayersSnappingManager as any).layerManager).toBe(mockLayerManager);
    });
  });

  // ---------------------------------------------------------------------------
  // destroy
  // ---------------------------------------------------------------------------

  describe('destroy', () => {
    test('sets initialized to false', () => {
      setup();
      OpenLayersSnappingManager.destroy();
      expect((OpenLayersSnappingManager as any).initialized.value).toBe(false);
    });

    test('removes the snap interaction from the map when snap was initialised', () => {
      setup({ withSnap: true });
      mockOlMap.removeInteraction.mockClear();

      OpenLayersSnappingManager.destroy();

      expect(mockOlMap.removeInteraction).toHaveBeenCalledWith(mockSnapInstance);
    });

    test('resets snap state flags after destroy', () => {
      setup({ withSnap: true });
      OpenLayersSnappingManager.destroy();

      expect((OpenLayersSnappingManager as any).snappingInteraction.value).toBeNull();
      expect((OpenLayersSnappingManager as any).snapInitialized).toBe(false);
      expect((OpenLayersSnappingManager as any).snapInitializing).toBe(false);
    });

    test('does not call removeInteraction when snap was never initialised', () => {
      setup(); // init only – no layer, no snap
      OpenLayersSnappingManager.destroy();
      expect(mockOlMap.removeInteraction).not.toHaveBeenCalled();
    });

    test('calls removeLayer on layerManager', () => {
      setup({ withLayer: true });
      OpenLayersSnappingManager.destroy();
      expect(mockLayerManager.removeLayer).toHaveBeenCalledWith('snapping-layer');
    });

    test('resets layer state flags after destroy', () => {
      setup({ withLayer: true });
      OpenLayersSnappingManager.destroy();

      expect((OpenLayersSnappingManager as any).snappingLayer.value).toBeNull();
      expect((OpenLayersSnappingManager as any).layerInitialized).toBe(false);
      expect((OpenLayersSnappingManager as any).layerInitializing).toBe(false);
    });

    test('allows the manager to be re-initialised and used after destroy', () => {
      setup({ withLayer: true });
      OpenLayersSnappingManager.destroy();

      const newMockOlMap = { addInteraction: jest.fn(), removeInteraction: jest.fn() };
      const newMockLayerManager = { addLayer: jest.fn().mockReturnValue(mockVectorLayer), removeLayer: jest.fn() };

      OpenLayersSnappingManager.init(newMockOlMap as any, newMockLayerManager as any);
      OpenLayersSnappingManager.renderFeatures([]);

      expect((OpenLayersSnappingManager as any).initialized.value).toBe(true);
      expect(newMockLayerManager.addLayer).toHaveBeenCalledTimes(1);
    });
  });

  // ---------------------------------------------------------------------------
  // setSnappingLayerStyle
  // ---------------------------------------------------------------------------

  describe('setSnappingLayerStyle', () => {
    test('calls setStyle on the snapping layer', () => {
      setup({ withLayer: true });
      const style = new Style();
      OpenLayersSnappingManager.setSnappingLayerStyle(style);
      expect(mockVectorLayer.setStyle).toHaveBeenCalledWith(style);
    });

    test('lazily initialises the snapping layer on the first call', () => {
      setup(); // init only – no layer yet
      expect(mockLayerManager.addLayer).not.toHaveBeenCalled();
      OpenLayersSnappingManager.setSnappingLayerStyle(new Style());
      expect(mockLayerManager.addLayer).toHaveBeenCalledTimes(1);
    });

    test('does not call addLayer again on subsequent calls', () => {
      setup({ withLayer: true });
      OpenLayersSnappingManager.setSnappingLayerStyle(new Style());
      OpenLayersSnappingManager.setSnappingLayerStyle(new Style());
      expect(mockLayerManager.addLayer).toHaveBeenCalledTimes(1);
    });
  });

  // ---------------------------------------------------------------------------
  // setSnappingTolerance
  // ---------------------------------------------------------------------------

  describe('setSnappingTolerance', () => {
    test('calls setProperties with the given pixelTolerance on the snap interaction', () => {
      setup({ withLayer: true });
      OpenLayersSnappingManager.setSnappingTolerance(10);
      expect(mockSnapInstance.setProperties).toHaveBeenCalledWith({ pixelTolerance: 10 });
    });

    test('lazily creates the snap interaction on the first call', () => {
      setup({ withLayer: true }); // layer ready, snap NOT yet created
      expect(mockSnap).not.toHaveBeenCalled();
      OpenLayersSnappingManager.setSnappingTolerance(5);
      expect(mockSnap).toHaveBeenCalledTimes(1);
    });
  });

  // ---------------------------------------------------------------------------
  // allowSnapping
  // ---------------------------------------------------------------------------

  describe('allowSnapping', () => {
    test('prevents enableSnappingIfAllowed from adding the interaction when false', () => {
      setup({ withLayer: true });
      OpenLayersSnappingManager.allowSnapping(false);
      OpenLayersSnappingManager.enableSnappingIfAllowed(true);
      expect(mockOlMap.addInteraction).not.toHaveBeenCalled();
    });

    test('does not remove an already-active snap interaction when set to false', () => {
      // allowSnapping(false) only blocks future enables; it does not tear down
      // the existing OL interaction (see enableSnappingIfAllowed guard).
      setup({ withSnap: true });
      mockOlMap.removeInteraction.mockClear();
      OpenLayersSnappingManager.allowSnapping(false);
      expect(mockOlMap.removeInteraction).not.toHaveBeenCalled();
    });

    test('enables enableSnappingIfAllowed to work when set to true', () => {
      setup({ withLayer: true });
      OpenLayersSnappingManager.allowSnapping(true);
      OpenLayersSnappingManager.enableSnappingIfAllowed(true);
      expect(mockOlMap.addInteraction).toHaveBeenCalledWith(mockSnapInstance);
    });
  });

  // ---------------------------------------------------------------------------
  // enableSnappingIfAllowed
  // ---------------------------------------------------------------------------

  describe('enableSnappingIfAllowed', () => {
    beforeEach(() => {
      setup({ withLayer: true });
      OpenLayersSnappingManager.allowSnapping(true);
    });

    test('creates a Snap interaction using the snapping layer source', () => {
      OpenLayersSnappingManager.enableSnappingIfAllowed(true);
      expect(mockSnap).toHaveBeenCalledWith({ source: mockVectorSource });
    });

    test('adds the snap interaction to the map when enabling', () => {
      OpenLayersSnappingManager.enableSnappingIfAllowed(true);
      expect(mockOlMap.addInteraction).toHaveBeenCalledWith(mockSnapInstance);
    });

    test('always removes the interaction before re-adding so snap is last in the chain', () => {
      OpenLayersSnappingManager.enableSnappingIfAllowed(true);
      mockOlMap.removeInteraction.mockClear();
      mockOlMap.addInteraction.mockClear();

      OpenLayersSnappingManager.enableSnappingIfAllowed(true);

      expect(mockOlMap.removeInteraction).toHaveBeenCalledWith(mockSnapInstance);
      expect(mockOlMap.addInteraction).toHaveBeenCalledWith(mockSnapInstance);
    });

    test('removes the snap interaction without re-adding it when disabling', () => {
      OpenLayersSnappingManager.enableSnappingIfAllowed(true);
      mockOlMap.removeInteraction.mockClear();
      mockOlMap.addInteraction.mockClear();

      OpenLayersSnappingManager.enableSnappingIfAllowed(false);

      expect(mockOlMap.removeInteraction).toHaveBeenCalledWith(mockSnapInstance);
      expect(mockOlMap.addInteraction).not.toHaveBeenCalled();
    });

    test('does nothing when snappingAllowed is false', () => {
      OpenLayersSnappingManager.allowSnapping(false);
      mockOlMap.addInteraction.mockClear();
      mockOlMap.removeInteraction.mockClear();

      OpenLayersSnappingManager.enableSnappingIfAllowed(true);

      expect(mockOlMap.addInteraction).not.toHaveBeenCalled();
      expect(mockOlMap.removeInteraction).not.toHaveBeenCalled();
    });

    test('only creates the Snap instance once regardless of how many times it is called', () => {
      OpenLayersSnappingManager.enableSnappingIfAllowed(true);
      OpenLayersSnappingManager.enableSnappingIfAllowed(false);
      OpenLayersSnappingManager.enableSnappingIfAllowed(true);
      expect(mockSnap).toHaveBeenCalledTimes(1);
    });
  });

  // ---------------------------------------------------------------------------
  // renderFeatures
  // ---------------------------------------------------------------------------

  describe('renderFeatures', () => {
    test('lazily initialises the snapping layer on the first call', () => {
      setup(); // init only
      expect(mockLayerManager.addLayer).not.toHaveBeenCalled();
      OpenLayersSnappingManager.renderFeatures([]);
      expect(mockLayerManager.addLayer).toHaveBeenCalledTimes(1);
    });

    test('adds the snapping layer with the correct configuration', () => {
      setup();
      OpenLayersSnappingManager.renderFeatures([]);
      expect(mockLayerManager.addLayer).toHaveBeenCalledWith({
        id: 'snapping-layer',
        name: 'Snapping layer',
        layerType: LayerTypesEnum.Vector,
        visible: true,
      });
    });

    test('clears existing features from the source before adding new ones', () => {
      setup({ withLayer: true });
      const existingFeature = { id: 'existing' } as any;
      mockVectorSource.getFeatures.mockReturnValue([existingFeature]);

      OpenLayersSnappingManager.renderFeatures([]);

      expect(mockVectorSource.removeFeature).toHaveBeenCalledWith(existingFeature);
    });

    test('adds each provided feature to the source', (done) => {
      setup({ withLayer: true });
      const featureA = { id: 'a' } as any;
      const featureB = { id: 'b' } as any;
      OpenLayersSnappingManager.renderFeatures([ featureA, featureB ]);
      (OpenLayersSnappingManager as any).snappingLayer.asObservable().subscribe(() => {
        expect(mockVectorSource.addFeature).toHaveBeenCalledTimes(2);
        expect(mockVectorSource.addFeature).toHaveBeenCalledWith(featureA);
        expect(mockVectorSource.addFeature).toHaveBeenCalledWith(featureB);
        done();
      });
    });

    test('does not call addFeature when an empty array is provided', () => {
      setup({ withLayer: true });
      OpenLayersSnappingManager.renderFeatures([]);
      expect(mockVectorSource.addFeature).not.toHaveBeenCalled();
    });

    test('does not call addLayer again on subsequent calls', () => {
      setup();
      OpenLayersSnappingManager.renderFeatures([]);
      OpenLayersSnappingManager.renderFeatures([]);
      expect(mockLayerManager.addLayer).toHaveBeenCalledTimes(1);
    });
  });
});




