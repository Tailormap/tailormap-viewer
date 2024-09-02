import { fireEvent, render, screen } from '@testing-library/angular';
import { MenubarButtonComponent } from './menubar-button.component';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { SharedModule } from '@tailormap-viewer/shared';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MenubarService } from '../menubar.service';
import { of } from 'rxjs';
import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  template: '<tm-menubar-button (buttonClicked)="click()" icon="test" component="test" panelTitle="test title">Some button</tm-menubar-button>',
})
export class MenubarButtonWrapperComponent {
  @Output()
  public buttonClicked = new EventEmitter();
  public click() { this.buttonClicked.emit(true); }
}

describe('MenubarButtonComponent', () => {

  test('should render', async () => {
    const onClick = jest.fn();
    const toggleActiveComponent = jest.fn();
    await render(MenubarButtonWrapperComponent, {
      declarations: [
        MenubarButtonComponent,
      ],
      imports: [
        MatIconTestingModule,
        SharedModule,
        NoopAnimationsModule,
      ],
      providers: [
        { provide: MenubarService, useValue: { isComponentVisible$: jest.fn(() => of(true)), toggleActiveComponent } },
      ],
      on: { buttonClicked: onClick },
    });
    expect(screen.getByText('Some button'));
    fireEvent.click(screen.getByText('Some button'));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(toggleActiveComponent).toHaveBeenCalledWith("test", "test title");
  });

});
