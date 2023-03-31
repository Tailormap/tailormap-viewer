import { render, screen, waitFor } from '@testing-library/angular';
import { ApplicationFormComponent } from './application-form.component';
import { getApplication } from '@tailormap-admin/admin-api';
import { SharedModule } from '@tailormap-viewer/shared';
import userEvent from '@testing-library/user-event';
import { BoundsModel, getBoundsModel } from '@tailormap-viewer/api';

const setup = async (hasApp?: boolean) => {
  const onUpdate = jest.fn();
  const application = getApplication({
    id: '1',
    title: 'Test application',
    initialExtent: getBoundsModel(),
    maxExtent: getBoundsModel(),
  });
  await render(ApplicationFormComponent, {
    imports: [SharedModule],
    componentInputs: {
      application: hasApp ? application : undefined,
    },
    componentProperties: {
      updateApplication: {
        emit: onUpdate,
      } as any,
    },
  });
  return { application, onUpdate };
};

const EMPTY_BOUNDS: BoundsModel = { minx: 0, miny: 0, maxx: 0, maxy: 0 };

describe('ApplicationFormComponent', () => {

  test('should render', async () => {
    const { onUpdate } = await setup();
    expect(await screen.findByPlaceholderText('Name')).toHaveValue('');
    await userEvent.type(await screen.findByPlaceholderText('Name'), 'new_app');
    await userEvent.type(await screen.findByPlaceholderText('Title'), 'Cool application');
    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith({
        name: 'new_app',
        title: 'Cool application',
        adminComments: '',
        crs: '',
        initialExtent: EMPTY_BOUNDS,
        maxExtent: EMPTY_BOUNDS,
        authenticatedRequired: false,
      });
    });
  });

  test('should render form for existing application', async () => {
    const { onUpdate, application } = await setup(true);
    expect(await screen.findByPlaceholderText('Name')).toHaveValue(application.name);
    expect(await screen.findByPlaceholderText('Title')).toHaveValue(application.title);
    await userEvent.click(await screen.findByPlaceholderText('Projection'));
    await userEvent.click(await screen.findByText('EPSG:3857', { exact: false }));
    await userEvent.click(await screen.findByText('Authentication required'));
    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith({
        name: application.name,
        title: application.title,
        adminComments: '',
        crs: 'EPSG:3857',
        initialExtent: application.initialExtent,
        maxExtent: application.maxExtent,
        authenticatedRequired: true,
      });
    });
  });

});
