import { render, screen } from '@testing-library/angular';
import { AdminFieldsRendererComponent } from './admin-fields-renderer.component';
import { SharedImportsModule } from '@tailormap-viewer/shared';
import userEvent from '@testing-library/user-event';

const setup = async (data?: Record<string, any>) => {
  const changedFn = jest.fn();
  await render(AdminFieldsRendererComponent, {
    imports: [SharedImportsModule],
    componentProperties: {
      fields: [
        { name: 'test', dataType: 'string', label: 'Test value', type: 'text' },
        { name: 'test2', dataType: 'string', label: 'Test choice', type: 'choice', values: [ 'test1', 'test2', 'test3' ] },
      ],
      data,
      changed: {
        emit: changedFn,
      } as any,
    },
  });
  return { changedFn };
};

describe('RegisteredFieldsRendererComponent', () => {

  test('should render', async () => {
    const { changedFn } = await setup();
    expect(await screen.findByText('Test value')).toBeInTheDocument();
    expect(await screen.findByText('Test choice')).toBeInTheDocument();
    await userEvent.type(await screen.findByRole('textbox'), 'bla');
    expect(changedFn).toHaveBeenCalledWith({
      test: 'bla',
      test2: '',
    });
  });

  test('should render existing data', async () => {
    await setup({ test2: 'test3' });
    expect(await screen.findByText('Test value')).toBeInTheDocument();
    expect(await screen.findByText('Test choice')).toBeInTheDocument();
    expect(await screen.findByText('test3')).toBeInTheDocument();
  });

});
