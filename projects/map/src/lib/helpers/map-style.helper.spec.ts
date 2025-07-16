import { MapStyleHelper } from './map-style.helper';
import { MapStyleModel } from '../models/map-style.model';
import { Feature } from 'ol';
import { Point, LineString, Polygon } from 'ol/geom';

describe('MapStyleHelper', () => {
  
  describe('selection rectangle', () => {
    
    it('should create selection rectangle for selected point features', () => {
      const feature = new Feature(new Point([0, 0]));
      const styleConfig: MapStyleModel = {
        styleKey: 'test',
        isSelected: true,
        pointType: 'square',
        pointFillColor: '#ff0000',
        pointStrokeColor: '#000000',
      };
      
      const styles = MapStyleHelper.mapStyleModelToOlStyle(styleConfig, feature);
      
      // Should have base style + point style + selection rectangle
      expect(styles.length).toBeGreaterThan(1);
      
      // Check that at least one style has geometry (selection rectangle)
      const hasSelectionRectangle = styles.some(style => 
        style.getGeometry() !== null && style.getGeometry() !== undefined
      );
      expect(hasSelectionRectangle).toBe(true);
    });
    
    it('should create selection rectangle for selected image features', () => {
      const feature = new Feature(new Point([0, 0]));
      const styleConfig: MapStyleModel = {
        styleKey: 'test',
        isSelected: true,
        pointImage: 'test-image.png',
        pointImageWidth: 24,
        pointImageHeight: 24,
      };
      
      const styles = MapStyleHelper.mapStyleModelToOlStyle(styleConfig, feature);
      
      // Should have base style + image style + selection rectangle
      expect(styles.length).toBeGreaterThan(1);
      
      // Check that at least one style has geometry (selection rectangle)
      const hasSelectionRectangle = styles.some(style => 
        style.getGeometry() !== null && style.getGeometry() !== undefined
      );
      expect(hasSelectionRectangle).toBe(true);
    });
    
    it('should create selection rectangle for selected point features with labels', () => {
      const feature = new Feature(new Point([0, 0]));
      const styleConfig: MapStyleModel = {
        styleKey: 'test',
        isSelected: true,
        pointType: 'square',
        pointFillColor: '#ff0000',
        pointStrokeColor: '#000000',
        label: 'Test Label',
        labelSize: 12,
        labelColor: '#000000',
      };
      
      const styles = MapStyleHelper.mapStyleModelToOlStyle(styleConfig, feature);
      
      // Should have base style + point style + label style + selection rectangle
      expect(styles.length).toBeGreaterThan(2);
      
      // Check that at least one style has geometry (selection rectangle)
      const hasSelectionRectangle = styles.some(style => 
        style.getGeometry() !== null && style.getGeometry() !== undefined
      );
      expect(hasSelectionRectangle).toBe(true);
    });
    
    it('should create selection rectangle for selected image features with labels', () => {
      const feature = new Feature(new Point([0, 0]));
      const styleConfig: MapStyleModel = {
        styleKey: 'test',
        isSelected: true,
        pointImage: 'test-image.png',
        pointImageWidth: 24,
        pointImageHeight: 24,
        label: 'Test Label',
        labelSize: 12,
        labelColor: '#000000',
      };
      
      const styles = MapStyleHelper.mapStyleModelToOlStyle(styleConfig, feature);
      
      // Should have base style + image style + label style + selection rectangle
      expect(styles.length).toBeGreaterThan(2);
      
      // Check that at least one style has geometry (selection rectangle)
      const hasSelectionRectangle = styles.some(style => 
        style.getGeometry() !== null && style.getGeometry() !== undefined
      );
      expect(hasSelectionRectangle).toBe(true);
    });
    
    it('should create selection rectangle for selected label-only features', () => {
      const feature = new Feature(new Point([0, 0]));
      const styleConfig: MapStyleModel = {
        styleKey: 'test',
        isSelected: true,
        pointType: 'label',
        label: 'Test Label',
        labelSize: 12,
        labelColor: '#000000',
      };
      
      const styles = MapStyleHelper.mapStyleModelToOlStyle(styleConfig, feature);
      
      // Should have base style + label style + selection rectangle
      expect(styles.length).toBeGreaterThan(1);
      
      // Check that at least one style has geometry (selection rectangle)
      const hasSelectionRectangle = styles.some(style => 
        style.getGeometry() !== null && style.getGeometry() !== undefined
      );
      expect(hasSelectionRectangle).toBe(true);
    });
    
    it('should create selection rectangle for selected line features', () => {
      const feature = new Feature(new LineString([[0, 0], [1, 1]]));
      const styleConfig: MapStyleModel = {
        styleKey: 'test',
        isSelected: true,
        strokeColor: '#ff0000',
        strokeWidth: 2,
      };
      
      const styles = MapStyleHelper.mapStyleModelToOlStyle(styleConfig, feature);
      
      // Should have base style + selection rectangle
      expect(styles.length).toBeGreaterThan(0);
      
      // Check that at least one style has geometry (selection rectangle)
      const hasSelectionRectangle = styles.some(style => 
        style.getGeometry() !== null && style.getGeometry() !== undefined
      );
      expect(hasSelectionRectangle).toBe(true);
    });
    
    it('should create selection rectangle for selected polygon features', () => {
      const feature = new Feature(new Polygon([[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]]));
      const styleConfig: MapStyleModel = {
        styleKey: 'test',
        isSelected: true,
        strokeColor: '#ff0000',
        strokeWidth: 2,
        fillColor: '#ff0000',
        fillOpacity: 0.3,
      };
      
      const styles = MapStyleHelper.mapStyleModelToOlStyle(styleConfig, feature);
      
      // Should have base style + selection rectangle
      expect(styles.length).toBeGreaterThan(0);
      
      // Check that at least one style has geometry (selection rectangle)
      const hasSelectionRectangle = styles.some(style => 
        style.getGeometry() !== null && style.getGeometry() !== undefined
      );
      expect(hasSelectionRectangle).toBe(true);
    });
    
    it('should not create selection rectangle for non-selected features', () => {
      const feature = new Feature(new Point([0, 0]));
      const styleConfig: MapStyleModel = {
        styleKey: 'test',
        isSelected: false,
        pointType: 'square',
        pointFillColor: '#ff0000',
        pointStrokeColor: '#000000',
      };
      
      const styles = MapStyleHelper.mapStyleModelToOlStyle(styleConfig, feature);
      
      // Check that no style has geometry (no selection rectangle)
      const hasSelectionRectangle = styles.some(style => 
        style.getGeometry() !== null && style.getGeometry() !== undefined
      );
      expect(hasSelectionRectangle).toBe(false);
    });
    
    it('should not create selection rectangle when no feature is provided', () => {
      const styleConfig: MapStyleModel = {
        styleKey: 'test',
        isSelected: true,
        pointType: 'square',
        pointFillColor: '#ff0000',
        pointStrokeColor: '#000000',
      };
      
      const styles = MapStyleHelper.mapStyleModelToOlStyle(styleConfig); // No feature parameter
      
      // Check that no style has geometry (no selection rectangle)
      const hasSelectionRectangle = styles.some(style => 
        style.getGeometry() !== null && style.getGeometry() !== undefined
      );
      expect(hasSelectionRectangle).toBe(false);
    });
    
  });
  
});