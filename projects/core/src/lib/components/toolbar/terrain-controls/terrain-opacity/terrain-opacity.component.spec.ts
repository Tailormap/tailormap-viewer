import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/angular';
import { TerrainOpacityComponent } from './terrain-opacity.component';
import { MatIconModule } from '@angular/material/icon';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { CommonModule } from '@angular/common';
import { getMapServiceMock } from '../../../../test-helpers/map-service.mock';

describe('TerrainOpacityComponent', () => {

  test('should render', async () => {
    await render(TerrainOpacityComponent, {
      imports: [ MatIconModule, MatIconTestingModule, CommonModule ],
      providers: [
        getMapServiceMock().provider,
      ],
      inputs: { label: 'Opacity' },
    });
    expect(screen.getByText('Opacity'));
    expect(screen.getByRole('slider'));
  });

});
