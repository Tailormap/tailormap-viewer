import { render, screen } from '@testing-library/angular';
import { LayerDetailsComponent } from './layer-details.component';
import { getAppLayerModel } from '@tailormap-viewer/api';
import userEvent from '@testing-library/user-event';
import { SharedModule } from '@tailormap-viewer/shared';
import { MatIconTestingModule } from '@angular/material/icon/testing';

describe('LayerDetailsComponent', () => {

  test('should render nothing if no layer is passed', async () => {
    await render(LayerDetailsComponent, {
      imports: [ SharedModule, MatIconTestingModule ],
    });
    expect(screen.queryByText('Details for')).not.toBeInTheDocument();
  });

  test('should render layer name', async () => {
    await render(LayerDetailsComponent, {
      imports: [ SharedModule, MatIconTestingModule ],
      componentProperties: {
        layer: getAppLayerModel({ title: 'The Layer' }),
      },
    });
    expect(screen.getByText('Details for The Layer')).toBeInTheDocument();
  });

  test('should trigger close', async () => {
    const closeMock = jest.fn();
    await render(LayerDetailsComponent, {
      imports: [ SharedModule, MatIconTestingModule ],
      componentProperties: {
        layer: getAppLayerModel({ title: 'The Layer' }),
        closeDetails: { emit: closeMock } as any,
      },
    });
    await userEvent.click(screen.getByLabelText('Close details'));
    expect(closeMock).toHaveBeenCalled();
  });

});
