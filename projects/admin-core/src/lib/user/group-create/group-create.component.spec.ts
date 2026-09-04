import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/angular';
import { GroupCreateComponent } from './group-create.component';
import { Component } from '@angular/core';
import { GroupService } from '../services/group.service';
import { GroupFormComponent } from '../group-form/group-form.component';

@Component({
  selector: 'tm-admin-group-form',
  template: '<div>Group Form</div>',
})
class MockGroupFormComponent {}

describe('GroupCreateComponent', () => {

  test('should render', async () => {
    await render(GroupCreateComponent, {
      importOverrides: [
        { replace: GroupFormComponent, with: MockGroupFormComponent },
      ],
      providers: [
        { provide: GroupService, useValue: {} },
      ],
    });
    expect(await screen.findByText('Add group')).toBeInTheDocument();
  });

});
