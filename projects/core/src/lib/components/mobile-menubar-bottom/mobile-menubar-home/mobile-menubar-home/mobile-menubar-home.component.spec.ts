import { render, screen } from '@testing-library/angular';
import { MobileMenubarHomeComponent } from './mobile-menubar-home.component';
import { MenubarService } from '../../../menubar';
import { of } from 'rxjs';

describe('MobileMenubarHomeComponent', () => {

  test('should render', async () => {
    await render(MobileMenubarHomeComponent, {
      providers: [
        { provide: MenubarService, useValue: {
            registerComponent: jest.fn(),
            isComponentVisible$: () => of(true),
            deregisterComponent: jest.fn(),
          },
        },
      ],
    });
    expect(screen.getByText('mobile-menubar-home works!'));
  });

});
