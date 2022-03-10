import { TocMenuButtonComponent } from './toc-menu-button.component';
import { fireEvent, render, screen } from '@testing-library/angular';
import { of } from 'rxjs';
import { TocService } from '../services/toc.service';

describe('TocMenuButtonComponent', () => {

  test('renders', async () => {
    const toggleVisibleFn = jest.fn();
    const tocService = {
      toggleVisible: toggleVisibleFn,
      isVisible: () => of(false),
    };
    await render(TocMenuButtonComponent, {
      providers: [
        { provide: TocService, useValue: tocService },
      ],
    });
    expect(await screen.findByRole('button')).toBeInTheDocument();
    fireEvent.click(await screen.findByRole('button'));
    expect(toggleVisibleFn).toHaveBeenCalled();
  });

});
