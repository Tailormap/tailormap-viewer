import { render, screen, waitFor } from '@testing-library/angular';
import { GeoServiceFormComponent } from './geo-service-form.component';
import { SharedModule } from '@tailormap-viewer/shared';
import userEvent from '@testing-library/user-event';
import { PasswordFieldComponent } from '../../shared/components/password-field/password-field.component';

describe('GeoServiceFormComponent', () => {

  test('should render', async () => {
    const changedFn = jest.fn();
    await render(GeoServiceFormComponent, {
      imports: [SharedModule],
      declarations: [PasswordFieldComponent],
      componentProperties: {
        changed: {
          emit: changedFn,
        } as any,
      },
    });
    await userEvent.type(await screen.findByPlaceholderText('URL'), 'http://localhost.test');
    await waitFor(() => {
      expect(changedFn).toHaveBeenCalledTimes(1);
      expect(changedFn).toHaveBeenCalledWith({
        title: '',
        url: 'http://localhost.test',
        protocol: 'wms',
        authentication: null,
        settings: { useProxy: false },
      });
    });
    await userEvent.click(await screen.findByText('wms'));
    await userEvent.click(await screen.findByText('wmts'));
    await waitFor(() => {
      expect(changedFn).toHaveBeenCalledTimes(2);
      expect(changedFn).toHaveBeenNthCalledWith(2, {
        title: '',
        url: 'http://localhost.test',
        protocol: 'wmts',
        authentication: null,
        settings: { useProxy: false },
      });
    });
  });

});
