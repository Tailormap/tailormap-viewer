import { MapStyleHelper } from './map-style.helper';
import { MapStyleModel } from '../models/map-style.model';
import { Feature } from 'ol';
import { Point } from 'ol/geom';

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
    
  });
  
});