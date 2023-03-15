import { render, screen, waitFor } from '@testing-library/angular';
import { LayerSettingsFormComponent } from './layer-settings-form.component';
import { SharedModule } from '@tailormap-viewer/shared';
import userEvent from '@testing-library/user-event';

describe('LayerSettingsFormComponent', () => {

  test('should render', async () => {
    const changedFn = jest.fn();
    await render(LayerSettingsFormComponent, {
      imports: [SharedModule],
      componentInputs: {
        isLayerSpecific: true,
      },
      componentProperties: {
        changed: {
          emit: changedFn,
        } as any,
      },
    });
    await userEvent.type(await screen.findByPlaceholderText('Title'), 'Some title');
    await waitFor(() => {
      expect(changedFn).toHaveBeenCalledTimes(1);
      expect(changedFn).toHaveBeenCalledWith({ title: 'Some title', hiDpiDisabled: undefined });
    });
    await userEvent.click(await screen.findByText('Disabled'));
    await waitFor(() => {
      expect(changedFn).toHaveBeenCalledTimes(2);
      expect(changedFn).toHaveBeenNthCalledWith(2, { title: 'Some title', hiDpiDisabled: true });
    });
  });

});
