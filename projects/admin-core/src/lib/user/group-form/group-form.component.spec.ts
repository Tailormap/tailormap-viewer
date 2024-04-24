import { render, screen, waitFor } from '@testing-library/angular';
import { GroupFormComponent } from './group-form.component';
import { SharedImportsModule } from '@tailormap-viewer/shared';
import userEvent from '@testing-library/user-event';
import { SharedAdminComponentsModule } from '../../shared/components/shared-admin-components.module';


const setup = async () => {
  const groupUpdated = jest.fn();
  await render(GroupFormComponent, {
    imports: [ SharedImportsModule, SharedAdminComponentsModule ],
    componentOutputs: {
      groupUpdated: {
        emit: groupUpdated,
      } as any,
    },
  });
  return { groupUpdated };
};

describe('GroupFormComponent', () => {

  test('should trigger user updated for a valid form', async () => {
    const { groupUpdated } = await setup();
    await userEvent.type(screen.getByLabelText('Name'), 'secret-group');
    await userEvent.type(screen.getByLabelText('Description'), 'A very secret group');
    await waitFor(() => {
      expect(groupUpdated).toHaveBeenCalledWith({
        name: 'secret-group',
        description: 'A very secret group',
        notes: null,
        systemGroup: false,
        additionalProperties: {},
      });
    });
  });

});
