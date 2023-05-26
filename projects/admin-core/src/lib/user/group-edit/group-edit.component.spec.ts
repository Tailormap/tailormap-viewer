import { render, screen } from '@testing-library/angular';
import { GroupEditComponent } from './group-edit.component';
import { of } from 'rxjs';
import { getGroup } from '@tailormap-admin/admin-api';
import { SaveButtonComponent } from '../../shared/components/save-button/save-button.component';
import { GroupDetailsService } from '../services/group-details.service';
import { ActivatedRoute, Router } from '@angular/router';
import { SharedImportsModule } from '@tailormap-viewer/shared';
import userEvent from '@testing-library/user-event';
import { TestSaveHelper } from '../../test-helpers/test-save.helper';
import { GroupFormComponent } from '../group-form/group-form.component';
import { MatIconTestingModule } from '@angular/material/icon/testing';

const setup = async (hasGroup?: boolean) => {
  const activeRoute = {
    paramMap: of({ get: () => 'secret-group' }),
  };
  const groupService = {
    selectGroup: jest.fn(),
    selectedGroup$: hasGroup ? of(getGroup({ name: 'secret-group', description: 'some secret group' })) : of(null),
    deleteGroup$: jest.fn(() => of(true)),
    addOrUpdateGroup$: jest.fn(() => of(true)),
  };
  const router = {
    navigateByUrl: jest.fn(),
  };
  await render(GroupEditComponent, {
    declarations: [ GroupFormComponent, SaveButtonComponent ],
    imports: [ SharedImportsModule, MatIconTestingModule ],
    providers: [
      { provide: ActivatedRoute, useValue: activeRoute },
      { provide: GroupDetailsService, useValue: groupService },
      { provide: Router, useValue: router },
    ],
  });
  return { groupService, router };
};

describe('GroupEditComponent', () => {

  test('should render empty', async () => {
    await setup();
    expect(await screen.queryByText('Edit secret-group')).not.toBeInTheDocument();
  });

  test('should render selected group', async () => {
    const { groupService } = await setup(true);
    expect(await screen.queryByText('Edit secret-group')).toBeInTheDocument();
    expect(groupService.selectGroup).toHaveBeenCalledWith('secret-group');
  });

  test('should update group', async () => {
    const { groupService } = await setup(true);
    await userEvent.type(screen.getByLabelText('Name'), '-123');
    await TestSaveHelper.waitForButtonToBeEnabledAndClick('Save');
    expect(groupService.addOrUpdateGroup$).toHaveBeenCalledWith(false, {
      name: 'secret-group-123',
      description: 'some secret group',
      notes: null,
      systemGroup: true,
    });
  });

  test('should delete group', async () => {
    const { groupService } = await setup(true);
    await userEvent.click(await screen.findByText('Delete'));
    expect(await screen.findByText('Are you sure you want to delete the group with name secret-group? This action cannot be undone.')).toBeInTheDocument();
    await userEvent.click(await screen.findByText('Yes'));
    expect(groupService.deleteGroup$).toHaveBeenCalledWith('secret-group');
  });

});
