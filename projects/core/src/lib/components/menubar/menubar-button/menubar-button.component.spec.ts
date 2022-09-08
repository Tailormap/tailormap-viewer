import { fireEvent, render, screen } from '@testing-library/angular';
import { MenubarButtonComponent } from './menubar-button.component';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { SharedModule } from '@tailormap-viewer/shared';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('MenubarButtonComponent', () => {

  test('should render', async () => {
    const onClick = jest.fn();
    await render('<tm-menubar-button (buttonClicked)="buttonClicked()" icon="test">Some button</tm-menubar-button>', {
      declarations: [
        MenubarButtonComponent,
      ],
      imports: [
        MatIconTestingModule,
        SharedModule,
        NoopAnimationsModule,
      ],
      componentProperties: {
        buttonClicked: onClick,
      },
    });
    expect(screen.getByText('Some button'));
    fireEvent.click(screen.getByText('Some button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

});
