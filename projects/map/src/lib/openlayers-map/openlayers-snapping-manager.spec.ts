import { OpenLayersSnappingManager } from './openlayers-snapping-manager';
import { Snap } from 'ol/interaction';
import { LayerTypesEnum } from '../models';
import { Style } from 'ol/style';
import { FeatureHelper } from '../helpers/feature.helper';
import { firstValueFrom } from 'rxjs';
import type { Mock } from 'vitest';

vi.mock('ol/interaction', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Snap: vi.fn(),
}));

const mockSnap = vi.mocked(Snap);
const getFeaturesFn = (FeatureHelper as any).getFeatures;

describe('OpenLayersSnappingManager', () => {
  let manager: OpenLayersSnappingManager;
  let mockOlMap: { addInteraction: Mock; removeInteraction: Mock };
  let mockVectorSource: {
    getFeatures: Mock;
    removeFeature: Mock;
    addFeature: Mock;
    getProjection: Mock;
  };
  let mockVectorLayer: { getSource: Mock; setStyle: Mock };
  let mockLayerManager: { addLayer: Mock; removeLayer: Mock };
  let mockSnapInstance: { setProperties: Mock };
  beforeEach(() => {
    vi.resetAllMocks();
    manager = new OpenLayersSnappingManager();
    mockVectorSource = {
      getFeatures: vi.fn().mockReturnValue([]),
      removeFeature: vi.fn(),
      addFeature: vi.fn(),
      getProjection: vi.fn().mockReturnValue(null),
    };
    mockVectorLayer = {
      getSource: vi.fn().mockReturnValue(mockVectorSource),
      setStyle: vi.fn(),
    };
    mockLayerManager = {
      addLayer: vi.fn().mockReturnValue(mockVectorLayer),
      removeLayer: vi.fn(),
    };
    mockOlMap = {
      addInteraction: vi.fn(),
      removeInteraction: vi.fn(),
    };
    mockSnapInstance = { setProperties: vi.fn() };
    mockSnap.mockImplementation(() => mockSnapInstance as unknown as Snap);
    (FeatureHelper as any).getFeatures = vi.fn((features: unknown[]) => features);
  });

  afterEach(() => {
    (FeatureHelper as any).getFeatures = getFeaturesFn;
  });

  const setup = ({ withLayer = false, withSnap = false } = {}) => {
    manager.init(mockOlMap as any, mockLayerManager as any);
    if (withLayer || withSnap) {
      manager.renderFeatures([]);
    }
    if (withSnap) {
      manager.allowSnapping(true);
      manager.enableSnappingIfAllowed(true);
    }
  };

  // ---------------------------------------------------------------------------
  // init
  // ---------------------------------------------------------------------------

  describe('init', () => {
    test('marks the manager as initialized', () => {
      manager.init(mockOlMap as any, mockLayerManager as any);
      expect((manager as any).initialized.value).toBe(true);
    });

    test('stores olMap and layerManager references', () => {
      manager.init(mockOlMap as any, mockLayerManager as any);
      expect((manager as any).olMap).toBe(mockOlMap);
      expect((manager as any).layerManager).toBe(mockLayerManager);
    });
  });

  // ---------------------------------------------------------------------------
  // destroy
  // ---------------------------------------------------------------------------

  describe('destroy', () => {
    test('sets initialized to false', () => {
      setup();
      manager.destroy();
      expect((manager as any).initialized.value).toBe(false);
    });

    test('removes the snap interaction from the map when snap was initialised', () => {
      setup({ withSnap: true });
      mockOlMap.removeInteraction.mockClear();

      manager.destroy();

      expect(mockOlMap.removeInteraction).toHaveBeenCalledWith(mockSnapInstance);
    });

    test('resets snap state flags after destroy', () => {
      setup({ withSnap: true });
      manager.destroy();

      expect((manager as any).snappingInteraction.value).toBeNull();
      expect((manager as any).snapInitialized).toBe(false);
      expect((manager as any).snapInitializing).toBe(false);
    });

    test('does not call removeInteraction when snap was never initialised', () => {
      setup(); // init only – no layer, no snap
      manager.destroy();
      expect(mockOlMap.removeInteraction).not.toHaveBeenCalled();
    });

    test('calls removeLayer on layerManager', () => {
      setup({ withLayer: true });
      manager.destroy();
      expect(mockLayerManager.removeLayer).toHaveBeenCalledWith('snapping-layer');
    });

    test('resets layer state flags after destroy', () => {
      setup({ withLayer: true });
      manager.destroy();

      expect((manager as any).snappingLayer.value).toBeNull();
      expect((manager as any).layerInitialized).toBe(false);
      expect((manager as any).layerInitializing).toBe(false);
    });

    test('allows the manager to be re-initialised and used after destroy', () => {
      setup({ withLayer: true });
      manager.destroy();

      const newMockOlMap = { addInteraction: vi.fn(), removeInteraction: vi.fn() };
      const newMockLayerManager = { addLayer: vi.fn().mockReturnValue(mockVectorLayer), removeLayer: vi.fn() };

      manager.init(newMockOlMap as any, newMockLayerManager as any);
      manager.renderFeatures([]);

      expect((manager as any).initialized.value).toBe(true);
      expect(newMockLayerManager.addLayer).toHaveBeenCalledTimes(2);
    });
  });

  // ---------------------------------------------------------------------------
  // setSnappingLayerStyle
  // ---------------------------------------------------------------------------

  describe('setSnappingLayerStyle', () => {
    test('calls setStyle on the snapping layer', () => {
      setup({ withLayer: true });
      const style = new Style();
      manager.setSnappingLayerStyle(style);
      expect(mockVectorLayer.setStyle).toHaveBeenCalledWith(style);
    });

    test('lazily initialises the snapping layer on the first call', () => {
      setup(); // init only – no layer yet
      expect(mockLayerManager.addLayer).not.toHaveBeenCalled();
      manager.setSnappingLayerStyle(new Style());
      expect(mockLayerManager.addLayer).toHaveBeenCalledTimes(2);
    });

    test('does not call addLayer again on subsequent calls', () => {
      setup({ withLayer: true });
      manager.setSnappingLayerStyle(new Style());
      manager.setSnappingLayerStyle(new Style());
      expect(mockLayerManager.addLayer).toHaveBeenCalledTimes(2);
    });
  });

  // ---------------------------------------------------------------------------
  // setSnappingTolerance
  // ---------------------------------------------------------------------------

  describe('setSnappingTolerance', () => {
    test('lazily creates the snap interaction on the first call', () => {
      setup({ withLayer: true }); // layer ready, snap NOT yet created
      expect(mockSnap).not.toHaveBeenCalled();
      manager.setSnappingTolerance(5);
      expect(mockSnap).toHaveBeenCalledTimes(1);
      expect(mockSnap).toHaveBeenCalledWith({ pixelTolerance: 5, source: expect.anything() });
    });
  });

  // ---------------------------------------------------------------------------
  // allowSnapping
  // ---------------------------------------------------------------------------

  describe('allowSnapping', () => {
    test('prevents enableSnappingIfAllowed from adding the interaction when false', () => {
      setup({ withLayer: true });
      manager.allowSnapping(false);
      manager.enableSnappingIfAllowed(true);
      expect(mockOlMap.addInteraction).not.toHaveBeenCalled();
    });

    test('does not remove an already-active snap interaction when set to false', () => {
      // allowSnapping(false) only blocks future enables; it does not tear down
      // the existing OL interaction (see enableSnappingIfAllowed guard).
      setup({ withSnap: true });
      mockOlMap.removeInteraction.mockClear();
      manager.allowSnapping(false);
      expect(mockOlMap.removeInteraction).not.toHaveBeenCalled();
    });

    test('enables enableSnappingIfAllowed to work when set to true', () => {
      setup({ withLayer: true });
      manager.allowSnapping(true);
      manager.enableSnappingIfAllowed(true);
      expect(mockOlMap.addInteraction).toHaveBeenCalledWith(mockSnapInstance);
    });
  });

  // ---------------------------------------------------------------------------
  // enableSnappingIfAllowed
  // ---------------------------------------------------------------------------

  describe('enableSnappingIfAllowed', () => {
    beforeEach(() => {
      setup({ withLayer: true });
      manager.allowSnapping(true);
    });

    test('creates a Snap interaction using the snapping layer source', () => {
      manager.enableSnappingIfAllowed(true);
      expect(mockSnap).toHaveBeenCalledWith({ pixelTolerance: 10, source: mockVectorSource });
    });

    test('adds the snap interaction to the map when enabling', () => {
      manager.enableSnappingIfAllowed(true);
      expect(mockOlMap.addInteraction).toHaveBeenCalledWith(mockSnapInstance);
    });

    test('always removes the interaction before re-adding so snap is last in the chain', () => {
      manager.enableSnappingIfAllowed(true);
      mockOlMap.removeInteraction.mockClear();
      mockOlMap.addInteraction.mockClear();

      manager.enableSnappingIfAllowed(true);

      expect(mockOlMap.removeInteraction).toHaveBeenCalledWith(mockSnapInstance);
      expect(mockOlMap.addInteraction).toHaveBeenCalledWith(mockSnapInstance);
    });

    test('removes the snap interaction without re-adding it when disabling', () => {
      manager.enableSnappingIfAllowed(true);
      mockOlMap.removeInteraction.mockClear();
      mockOlMap.addInteraction.mockClear();

      manager.enableSnappingIfAllowed(false);

      expect(mockOlMap.removeInteraction).toHaveBeenCalledWith(mockSnapInstance);
      expect(mockOlMap.addInteraction).not.toHaveBeenCalled();
    });

    test('does nothing when snappingAllowed is false', () => {
      manager.allowSnapping(false);
      mockOlMap.addInteraction.mockClear();
      mockOlMap.removeInteraction.mockClear();

      manager.enableSnappingIfAllowed(true);

      expect(mockOlMap.addInteraction).not.toHaveBeenCalled();
      expect(mockOlMap.removeInteraction).not.toHaveBeenCalled();
    });

    test('only creates the Snap instance once regardless of how many times it is called', () => {
      manager.enableSnappingIfAllowed(true);
      manager.enableSnappingIfAllowed(false);
      manager.enableSnappingIfAllowed(true);
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
      manager.renderFeatures([]);
      expect(mockLayerManager.addLayer).toHaveBeenCalledTimes(2);
    });

    test('adds the snapping layer with the correct configuration', () => {
      setup();
      manager.renderFeatures([]);
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

      manager.renderFeatures([]);

      expect(mockVectorSource.removeFeature).toHaveBeenCalledWith(existingFeature);
    });

    test('adds each provided feature to the source', async () => {
      setup({ withLayer: true });
      const featureA = { id: 'a' } as any;
      const featureB = { id: 'b' } as any;
      manager.renderFeatures([ featureA, featureB ]);
      await firstValueFrom((manager as any).snappingLayer.asObservable());
      expect(mockVectorSource.addFeature).toHaveBeenCalledTimes(2);
      expect(mockVectorSource.addFeature).toHaveBeenCalledWith(featureA);
      expect(mockVectorSource.addFeature).toHaveBeenCalledWith(featureB);
    });

    test('does not call addFeature when an empty array is provided', () => {
      setup({ withLayer: true });
      manager.renderFeatures([]);
      expect(mockVectorSource.addFeature).not.toHaveBeenCalled();
    });

    test('does not call addLayer again on subsequent calls', () => {
      setup();
      manager.renderFeatures([]);
      manager.renderFeatures([]);
      expect(mockLayerManager.addLayer).toHaveBeenCalledTimes(2);
    });
  });
});




