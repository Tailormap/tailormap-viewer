import { render, screen } from '@testing-library/angular';
import { AdminFieldsRendererComponent } from './admin-fields-renderer.component';
import { SharedImportsModule } from '@tailormap-viewer/shared';
import userEvent from '@testing-library/user-event';
import { AdditionalPropertyModel } from '@tailormap-admin/admin-api';

const setup = async (data?: AdditionalPropertyModel[]) => {
  const changedFn = jest.fn();
  await render(AdminFieldsRendererComponent, {
    imports: [SharedImportsModule],
    componentProperties: {
      fields: [
        { key: 'test', dataType: 'string', label: 'Test value', type: 'text', isPublic: false },
        { key: 'test2', dataType: 'string', label: 'Test choice', type: 'choice', values: [ 'test1', 'test2', 'test3' ], isPublic: true },
      ],
      data,
      changed: {
        emit: changedFn,
      } as any,
    },
  });
  return { changedFn };
};

describe('AdminFieldsRendererComponent', () => {

  test('should render', async () => {
    const { changedFn } = await setup();
    expect(await screen.findByText('Test value')).toBeInTheDocument();
    expect(await screen.findByText('Test choice')).toBeInTheDocument();
    await userEvent.type(await screen.findByRole('textbox'), 'bla');
    expect(changedFn).toHaveBeenCalledWith([
      { key: 'test', value: 'bla', isPublic: false },
      { key: 'test2', value: '', isPublic: true },
    ]);
  });

  test('should render existing data', async () => {
    await setup([{ key: 'test2', value: 'test3', isPublic: true }]);
    expect(await screen.findByText('Test value')).toBeInTheDocument();
    expect(await screen.findByText('Test choice')).toBeInTheDocument();
    expect(await screen.findByText('test3')).toBeInTheDocument();
  });

});
