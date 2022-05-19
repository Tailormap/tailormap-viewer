import { render, screen } from '@testing-library/angular';
import { DrawingStyleFormComponent } from './drawing-style-form.component';
import { SharedModule } from '@tailormap-viewer/shared';
import { DrawingFeatureTypeEnum } from '../models/drawing-feature-type.enum';
import { MatIconTestingModule } from '@angular/material/icon/testing';

describe('DrawingStyleFormComponent', () => {

  test('should render empty without type', async () => {
    await render(DrawingStyleFormComponent, {
      imports: [ SharedModule ],
    });
    expect(screen.queryByText('Symbol')).not.toBeInTheDocument();
    expect(screen.queryByText('Line')).not.toBeInTheDocument();
    expect(screen.queryByText('Fill')).not.toBeInTheDocument();
    expect(screen.queryByText('Label')).not.toBeInTheDocument();
  });

  test('should render point settings', async () => {
    await render(DrawingStyleFormComponent, {
      imports: [ SharedModule, MatIconTestingModule ],
      componentProperties: {
        type: DrawingFeatureTypeEnum.POINT,
      },
    });
    expect((await screen.getAllByText('Symbol')).length).toEqual(2);
    expect(screen.queryByText('Line')).not.toBeInTheDocument();
    expect(screen.queryByText('Fill')).not.toBeInTheDocument();
    expect((await screen.getAllByText('Label')).length).toEqual(2);
  });

  test('should render line settings', async () => {
    await render(DrawingStyleFormComponent, {
      imports: [ SharedModule, MatIconTestingModule ],
      componentProperties: {
        type: DrawingFeatureTypeEnum.LINE,
      },
    });
    expect(screen.queryByText('Symbol')).not.toBeInTheDocument();
    expect(screen.getByText('Line')).toBeInTheDocument();
    expect(screen.queryByText('Fill')).not.toBeInTheDocument();
    expect(screen.queryByText('Label')).not.toBeInTheDocument();
  });

  test('should render polygon settings', async () => {
    await render(DrawingStyleFormComponent, {
      imports: [ SharedModule, MatIconTestingModule ],
      componentProperties: {
        type: DrawingFeatureTypeEnum.POLYGON,
      },
    });
    expect(screen.queryByText('Symbol')).not.toBeInTheDocument();
    expect(screen.getByText('Line')).toBeInTheDocument();
    expect(screen.getByText('Fill')).toBeInTheDocument();
    expect(screen.queryByText('Label')).not.toBeInTheDocument();
  });

});
