import { fireEvent, render, screen } from '@testing-library/angular';
import { MenubarButtonComponent } from './menubar-button.component';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { SharedModule } from '@tailormap-viewer/shared';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MenubarService } from '../menubar.service';
import { of } from 'rxjs';

describe('MenubarButtonComponent', () => {
  test('renders with default inputs', async () => {
    await render(MenubarButtonComponent, {
      imports: [ MatIconTestingModule, SharedModule, NoopAnimationsModule ], providers: [{
        provide: MenubarService, useValue: { isComponentVisible$: jest.fn(() => of(false)), toggleActiveComponent: jest.fn() },
      }],
    });
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  test('emits buttonClicked event on click', async () => {
    const onClick = jest.fn();
    await render(MenubarButtonComponent, {
      imports: [ MatIconTestingModule, SharedModule, NoopAnimationsModule ],
      providers: [{
        provide: MenubarService,
        useValue: { isComponentVisible$: jest.fn(() => of(false)), toggleActiveComponent: jest.fn() },
      }],
      componentProperties: {
        component: 'test', panelTitle: 'test title', buttonClicked: { emit: onClick } as any,
      },
    });
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  test('calls toggleActiveComponent with correct arguments on click', async () => {
    const toggleActiveComponent = jest.fn();
    await render(MenubarButtonComponent, {
      imports: [ MatIconTestingModule, SharedModule, NoopAnimationsModule ],
      providers: [{ provide: MenubarService, useValue: { isComponentVisible$: jest.fn(() => of(false)), toggleActiveComponent } }],
      inputs: { component: 'test', panelTitle: 'test title' },
    });
    fireEvent.click(screen.getByRole('button'));
    expect(toggleActiveComponent).toHaveBeenCalledWith('test', 'test title');
  });

  test('does not call toggleActiveComponent if component is undefined', async () => {
    const toggleActiveComponent = jest.fn();
    await render(MenubarButtonComponent, {
      imports: [ MatIconTestingModule, SharedModule, NoopAnimationsModule ],
      providers: [{ provide: MenubarService, useValue: { isComponentVisible$: jest.fn(() => of(false)), toggleActiveComponent } }],
    });
    fireEvent.click(screen.getByRole('button'));
    expect(toggleActiveComponent).not.toHaveBeenCalled();
  });

  test('sets active$ observable based on isComponentVisible$', async () => {
    const isComponentVisible$ = jest.fn(() => of(true));
    const { fixture } = await render(MenubarButtonComponent, {
      imports: [ MatIconTestingModule, SharedModule, NoopAnimationsModule ],
      providers: [{ provide: MenubarService, useValue: { isComponentVisible$, toggleActiveComponent: jest.fn() } }],
      inputs: { component: 'test' },
    });
    const instance = fixture.componentInstance;
    instance.active$.subscribe((active) => {
      expect(active).toBe(true);
    });
  });

});
