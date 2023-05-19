import { render, screen } from '@testing-library/angular';
import { GroupsPageComponent } from './groups-page.component';
import { SharedModule } from '@tailormap-viewer/shared';
import { MatListModule } from '@angular/material/list';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { AdminTemplateComponent } from '../../templates/admin-template/admin-template.component';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';


const setup = async () => {
  await render(GroupsPageComponent, {
    imports: [ SharedModule, MatListModule, MatIconTestingModule ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    declarations: [AdminTemplateComponent],
    providers: [],
  });
};

describe('GroupsPageComponent', () => {

  test('should render', async () => {
    await setup();
    expect(await screen.findAllByText('Group Administration')).toHaveLength(1);
  });

});
