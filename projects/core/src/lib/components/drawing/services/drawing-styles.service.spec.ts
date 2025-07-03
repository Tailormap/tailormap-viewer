import { TestBed } from '@angular/core/testing';
import { DrawingStylesService } from './drawing-styles.service';
import { DrawingFeatureModelAttributes } from '../models/drawing-feature.model';
import { throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { TestScheduler } from 'rxjs/testing';
import { TAILORMAP_API_V1_SERVICE, TailormapApiV1MockService } from '@tailormap-viewer/api';

describe('DrawingStylesService', () => {
  let service: DrawingStylesService;
  let scheduler: TestScheduler;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: TAILORMAP_API_V1_SERVICE, useClass: TailormapApiV1MockService },
        DrawingStylesService,
      ],
    });
    service = TestBed.inject(DrawingStylesService);
    scheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
  });

  test('should return drawing styles from the mock service', (done) => {
    service.getDrawingStyles$().subscribe((styles: DrawingFeatureModelAttributes[]) => {
      expect(Array.isArray(styles)).toBe(true);
      expect(styles.length).toBeGreaterThan(0);
      expect(styles[0]).toHaveProperty('type', 'IMAGE');
      expect(styles[0]).toHaveProperty('style');
      done();
    });
  });

  test('should return error if no latest style is available', (done) => {
    scheduler.run(({ expectObservable }) => {
      const mockService = TestBed.inject(TAILORMAP_API_V1_SERVICE);
      jest.spyOn(mockService, 'getLatestUpload$')
        .mockReturnValue(
          throwError(()=>new HttpErrorResponse({
              status: 404,
              statusText: 'Not Found',
            }),
          ));

      const expectedMarble = '#';
      const expectedError = new HttpErrorResponse({
        status: 404,
        statusText: 'Not Found',
      });
      expectObservable(service.getDrawingStyles$()).toBe(expectedMarble, undefined, expectedError);
      done();
    });
  });
});
