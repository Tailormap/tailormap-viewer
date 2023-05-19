import { render, screen } from '@testing-library/angular';
import { UserAdminPageComponent } from './user-admin-page.component';
import { SharedModule } from '@tailormap-viewer/shared';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { AdminTemplateComponent } from '../../templates/admin-template/admin-template.component';
import { MatListModule } from '@angular/material/list';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';


const setup = async () => {
  await render(UserAdminPageComponent, {
    imports: [ SharedModule, MatListModule, MatIconTestingModule ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    declarations: [AdminTemplateComponent],
    providers: [],
  });
};

describe('UserAdminPageComponent', () => {
  test('should render', async () => {
    await setup();
    // title
    expect(await screen.findAllByText('User Administration')).toHaveLength(1);
  });
});
