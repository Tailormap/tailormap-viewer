import { TestBed } from '@angular/core/testing';
import { DrawingStylesService } from './drawing-styles.service';
import { TAILORMAP_API_V1_SERVICE } from './tailormap-api-v1.service.injection-token';
import { DrawingFeatureStyleModel } from '../../../../core/src/lib/components/drawing/models/drawing-feature.model';
import { TailormapApiV1MockService } from './tailormap-api-v1-mock.service';
import { of } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

describe('DrawingStylesService', () => {
  let service: DrawingStylesService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: TAILORMAP_API_V1_SERVICE, useClass: TailormapApiV1MockService },
        DrawingStylesService,
      ],
    });
    service = TestBed.inject(DrawingStylesService);
  });

  test('should return drawing styles from the mock service', (done) => {
    service.getDrawingStyle$().subscribe((styles: DrawingFeatureStyleModel[]) => {
      expect(Array.isArray(styles)).toBe(true);
      expect(styles.length).toBeGreaterThan(0);
      expect(styles[0]).toHaveProperty('type', 'IMAGE');
      expect(styles[0]).toHaveProperty('style');
      done();
    });
  });

  test('should return an empty array if no latest style is available', (done) => {
    const mockService = TestBed.inject(TAILORMAP_API_V1_SERVICE);
    jest.spyOn(mockService, 'getLatestUpload$')
      .mockReturnValue(
        of(new HttpErrorResponse({
          status: 404,
          statusText: 'Not Found',
        }),
      ));

    service.getDrawingStyle$().subscribe((styles: DrawingFeatureStyleModel[]) => {
      expect(styles).toEqual([]);
      done();
    });
  });
});
