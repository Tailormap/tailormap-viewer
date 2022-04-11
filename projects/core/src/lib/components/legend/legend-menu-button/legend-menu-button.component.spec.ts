import { LegendMenuButtonComponent } from './legend-menu-button.component';
import { fireEvent, render, screen } from '@testing-library/angular';
import { of } from 'rxjs';
import { LegendService } from '../services/legend.service';
import { MenubarButtonComponent } from '../../menubar';
import { SharedModule } from '@tailormap-viewer/shared';
import { MatIconTestingModule } from '@angular/material/icon/testing';

describe('TocMenuButtonComponent', () => {

  test('renders', async () => {
    const toggleVisibleFn = jest.fn();
    const tocService = {
      toggleVisible: toggleVisibleFn,
      isVisible$: () => of(false),
    };
    await render(LegendMenuButtonComponent, {
      declarations: [ MenubarButtonComponent ],
      imports: [ SharedModule, MatIconTestingModule ],
      providers: [
        { provide: LegendService, useValue: tocService },
      ],
    });
    expect(await screen.findByRole('button')).toBeInTheDocument();
    fireEvent.click(await screen.findByRole('button'));
    expect(toggleVisibleFn).toHaveBeenCalled();
  });

});
