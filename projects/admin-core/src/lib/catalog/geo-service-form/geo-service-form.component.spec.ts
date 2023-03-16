import { render, screen, waitFor } from '@testing-library/angular';
import { GeoServiceFormComponent } from './geo-service-form.component';
import { SharedModule } from '@tailormap-viewer/shared';
import userEvent from '@testing-library/user-event';

describe('GeoServiceFormComponent', () => {

  test('should render', async () => {
    const changedFn = jest.fn();
    await render(GeoServiceFormComponent, {
      imports: [SharedModule],
      componentProperties: {
        changed: {
          emit: changedFn,
        } as any,
      },
    });
    await userEvent.type(await screen.findByPlaceholderText('ID'), 'test');
    await userEvent.type(await screen.findByPlaceholderText('URL'), 'http://localhost.test');
    await waitFor(() => {
      expect(changedFn).toHaveBeenCalledTimes(1);
      expect(changedFn).toHaveBeenCalledWith({ id: 'test', title: '', url: 'http://localhost.test', protocol: 'wms' });
    });
    await userEvent.click(await screen.findByText('wms'));
    await userEvent.click(await screen.findByText('wmts'));
    await waitFor(() => {
      expect(changedFn).toHaveBeenCalledTimes(2);
      expect(changedFn).toHaveBeenNthCalledWith(2, { id: 'test', title: '', url: 'http://localhost.test', protocol: 'wmts' });
    });
  });

});
