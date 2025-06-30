import { inject, Injectable } from '@angular/core';
import { DrawingFeatureStyleModel } from '../../../../core/src/lib/components/drawing/models/drawing-feature.model';
import { catchError, map, Observable, of } from 'rxjs';
import { TAILORMAP_API_V1_SERVICE } from './tailormap-api-v1.service.injection-token';

@Injectable({
    providedIn: 'root',
})
export class DrawingStylesService {
    private apiService = inject(TAILORMAP_API_V1_SERVICE);

    /**
     * Fetches the latest drawing styles from the API.
     * Returns an observable that emits an array of DrawingFeatureStyleModel.
     * If the API call fails, it returns an empty array.
     */
    public getDrawingStyles$(): Observable<DrawingFeatureStyleModel[]> {
        return this.apiService.getLatestUpload$('drawing-style')
            .pipe(catchError(() => of([])),
                map((response: any) => Array.isArray(response?.styles) ?
                    response.styles as DrawingFeatureStyleModel[] : [],
                ),
            );
    }
}
