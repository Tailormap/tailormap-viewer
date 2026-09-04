import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/angular';
import { ApplicationCreateComponent } from './application-create.component';
import { ApplicationService } from '../services/application.service';
import { of } from 'rxjs';
import { ApplicationFormComponent } from '../application-form/application-form.component';
import { Component } from '@angular/core';

@Component({
  selector: 'tm-admin-application-form',
  template: '<div>Application Form</div>',
})
class MockApplicationFormComponent {}

describe('ApplicationCreateComponent', () => {

  test('should render', async () => {
    await render(ApplicationCreateComponent, {
      importOverrides: [
        { replace: ApplicationFormComponent, with: MockApplicationFormComponent },
      ],
      providers: [
        { provide: ApplicationService, useValue: { createApplication$: vi.fn(() => of({})) } },
      ],
    });
    expect(screen.getByText('Create application')).toBeInTheDocument();
  });

});
