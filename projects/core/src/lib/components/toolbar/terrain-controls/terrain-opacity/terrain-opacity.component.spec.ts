import { render, screen } from '@testing-library/angular';
import { TerrainOpacityComponent } from './terrain-opacity.component';
import { MatIconModule } from '@angular/material/icon';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { SharedModule } from '@tailormap-viewer/shared';
import { CommonModule } from '@angular/common';
import { getMapServiceMock } from '../../../../test-helpers/map-service.mock.spec';

describe('TerrainTranslucencyComponent', () => {

  test('should render', async () => {
    await render(TerrainOpacityComponent, {
      imports: [ MatIconModule, MatIconTestingModule, SharedModule, CommonModule ],
      providers: [
        getMapServiceMock().provider,
      ],
    });
    expect(screen.getByText('Opacity'));
    expect(screen.getByRole('slider'));
  });

});
