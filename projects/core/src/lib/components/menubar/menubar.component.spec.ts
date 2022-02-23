import { render, screen } from '@testing-library/angular';
import { Component } from '@angular/core';
import { MenubarComponent } from './menubar.component';
import { MenubarService } from './menubar.service';
import { of } from 'rxjs';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { MenubarButtonComponent } from './menubar-button/menubar-button.component';
import { SharedModule } from '@tailormap-viewer/shared';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

@Component({
  selector: 'tm-menu-button-test',
  template: '<tm-menubar-button icon="test" [tooltip$]="tooltip$">Click me</tm-menubar-button>',
})
class TmTestingComponent {
  public tooltip$ = of('MenuButton');
}

const mockedControlsService = {
  getRegisteredComponents$: () => {
    return of([TmTestingComponent]);
  },
};

describe('Menubarcomponent', () => {

  test('should render', async () => {
    await render(MenubarComponent, {
      declarations: [
        MenubarComponent,
        MenubarButtonComponent,
      ],
      imports: [
        SharedModule,
        NoopAnimationsModule,
        MatIconTestingModule,
      ],
      providers: [
        { provide: MenubarService, useValue: mockedControlsService },
      ],
    });
    expect(await screen.findByText(/Click me/)).toBeInTheDocument();
  });

});
