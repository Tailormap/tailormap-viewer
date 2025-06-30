import { inject, Injectable } from '@angular/core';
import { DrawingFeatureStyleModel } from '../../../../core/src/lib/components/drawing/models/drawing-feature.model';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { TAILORMAP_API_V1_SERVICE } from './tailormap-api-v1.service.injection-token';

@Injectable({
    providedIn: 'root',
})
export class DrawingStylesService {
    private apiService = inject(TAILORMAP_API_V1_SERVICE);

    public getDrawingStyle$(): Observable<DrawingFeatureStyleModel[]> {
        return this.apiService.getLatestUpload$('drawing-style')
            .pipe(catchError(() => of([])),
                tap(response => console.debug('Received drawing styles:', response)),
                // map the response styles object to DrawingFeatureStyleModel[]
                map((response: any) => Array.isArray(response?.styles) ?
                    response.styles as DrawingFeatureStyleModel[] : [],
                ),
            );
    }
}
