import { render, screen } from '@testing-library/angular';
import { ProjectionAvailabilityComponent } from './projection-availability.component';
import { SharedModule } from '@tailormap-viewer/shared';
import { MatIconTestingModule } from '@angular/material/icon/testing';

describe('ProjectionAvailabilityComponent', () => {

  test('should render with projections', async () => {
    await render(ProjectionAvailabilityComponent, {
      imports: [ SharedModule, MatIconTestingModule ],
      inputs: {
        projectionAvailability: [
          { label: 'EPSG:28992 (Amersfoort / RD New)', available: false },
          { label: 'EPSG:3857 (WGS 84 / Pseudo-Mercator)', available: true },
        ],
      },
    });
    expect(screen.getByText('EPSG:28992 (Amersfoort / RD New)')).toBeInTheDocument();
    expect(screen.getByText('EPSG:3857 (WGS 84 / Pseudo-Mercator)')).toBeInTheDocument();
    expect(screen.getByText('EPSG:28992 (Amersfoort / RD New)').closest('mat-list-item')?.querySelector('.list-icon.unavailable')).toBeInTheDocument();
    expect(screen.getByText('EPSG:3857 (WGS 84 / Pseudo-Mercator)').closest('mat-list-item')?.querySelector('.list-icon.available')).toBeInTheDocument();
  });

});
