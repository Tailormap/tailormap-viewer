import { describe, test, expect, vi, afterEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/angular';
import { Clipboard } from '@angular/cdk/clipboard';
import userEvent from '@testing-library/user-event';
import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { BoundsModel } from '@tailormap-viewer/api';
import { BoundsFieldComponent } from './bounds-field.component';

@Component({
  template: '<tm-admin-bounds-form-field [formControl]="control" projection="EPSG:28992" label="Extent" />',
  imports: [ BoundsFieldComponent, ReactiveFormsModule ],
})
class HostComponent {
  public control = new FormControl<BoundsModel | null>({ minx: 1, miny: 2, maxx: 3, maxy: 4 });
}

const getInputs = () => screen.getAllByRole('spinbutton') as HTMLInputElement[];

describe('BoundsFieldComponent', () => {

  test('should render', async () => {
    await render(BoundsFieldComponent);
    expect(screen.getByText('Bounds')).toBeInTheDocument();
  });

  test('renders label and bounds input', async () => {
    const changed = vi.fn();
    await render(BoundsFieldComponent, {
      inputs: { label: 'My extent', bounds: { minx: 1, miny: 2, maxx: 3, maxy: 4 } },
      on: { changed },
    });
    expect(screen.getByText('My extent')).toBeInTheDocument();
    expect(getInputs().map(i => i.value)).toEqual([ '1', '2', '3', '4' ]);
    expect(changed).not.toHaveBeenCalled();
  });

  test('works as form control', async () => {
    const { fixture } = await render(HostComponent);
    const control = fixture.componentInstance.control;
    expect(getInputs().map(i => i.value)).toEqual([ '1', '2', '3', '4' ]);

    control.setValue({ minx: 5, miny: 6, maxx: 7, maxy: 8 });
    fixture.detectChanges();
    await fixture.whenStable();
    expect(getInputs().map(i => i.value)).toEqual([ '5', '6', '7', '8' ]);
    expect(control.dirty).toBe(false);

    await userEvent.clear(getInputs()[0]);
    await userEvent.type(getInputs()[0], '10');
    await fixture.whenStable();
    expect(control.value).toEqual({ minx: 10, miny: 6, maxx: 7, maxy: 8, crs: 'EPSG:28992' });

    await userEvent.click(screen.getByRole('button', { name: 'Clear' }));
    await fixture.whenStable();
    expect(control.value).toBeNull();
    expect(getInputs().map(i => i.value)).toEqual([ '', '', '', '' ]);
  });

  test('does not emit partially filled bounds', async () => {
    const { fixture } = await render(HostComponent);
    const control = fixture.componentInstance.control;
    await userEvent.clear(getInputs()[0]);
    await fixture.whenStable();
    expect(control.value).toEqual({ minx: 1, miny: 2, maxx: 3, maxy: 4 });
  });

  test('disables fields', async () => {
    const { fixture } = await render(HostComponent);
    fixture.componentInstance.control.disable();
    fixture.detectChanges();
    await fixture.whenStable();
    getInputs().forEach(i => expect(i).toBeDisabled());
    expect(screen.getByRole('button', { name: 'Clear' })).toBeDisabled();
    fixture.componentInstance.control.enable();
    fixture.detectChanges();
    await fixture.whenStable();
    getInputs().forEach(i => expect(i).toBeEnabled());
  });

  test('parses pasted bounds', async () => {
    const { fixture } = await render(HostComponent);
    const control = fixture.componentInstance.control;
    await userEvent.click(getInputs()[0]);
    await userEvent.paste('10, 20, 30, 40');
    await fixture.whenStable();
    expect(control.value).toEqual({ minx: 10, miny: 20, maxx: 30, maxy: 40, crs: 'EPSG:28992' });
    expect(getInputs().map(i => i.value)).toEqual([ '10', '20', '30', '40' ]);
  });

  describe('copy to clipboard', () => {

    const COPY_LABEL = 'Copy extent to clipboard';
    const COPY_DISABLED_LABEL = 'First fill in all fields to copy the extent to the clipboard';

    const renderWithClipboard = async (copyResult = true) => {
      const copy = vi.fn(() => copyResult);
      const result = await render(HostComponent, {
        providers: [{ provide: Clipboard, useValue: { copy } }],
      });
      return { ...result, copy };
    };

    const isCheckIconVisible = (button: HTMLElement) => button.querySelector('mat-icon[data-mat-icon-name="check"]') !== null;

    afterEach(() => {
      vi.useRealTimers();
    });

    test('copies the bounds as comma-separated list', async () => {
      const { copy } = await renderWithClipboard();
      const button = screen.getByRole('button', { name: COPY_LABEL });
      expect(button).toBeEnabled();
      await userEvent.click(button);
      expect(copy).toHaveBeenCalledWith('1, 2, 3, 4');
    });

    test('copies the current (edited) bounds', async () => {
      const { copy, fixture } = await renderWithClipboard();
      await userEvent.clear(getInputs()[2]);
      await userEvent.type(getInputs()[2], '30');
      await fixture.whenStable();
      await userEvent.click(screen.getByRole('button', { name: COPY_LABEL }));
      expect(copy).toHaveBeenCalledWith('1, 2, 30, 4');
    });

    test('is disabled when bounds are incomplete', async () => {
      const { copy, fixture } = await renderWithClipboard();
      await userEvent.clear(getInputs()[0]);
      await fixture.whenStable();
      const button = screen.getByRole('button', { name: COPY_DISABLED_LABEL });
      expect(button).toBeDisabled();
      fireEvent.click(button);
      expect(copy).not.toHaveBeenCalled();
    });

    test('is disabled when bounds are empty', async () => {
      const { fixture } = await renderWithClipboard();
      await userEvent.click(screen.getByRole('button', { name: 'Clear' }));
      await fixture.whenStable();
      expect(screen.getByRole('button', { name: COPY_DISABLED_LABEL })).toBeDisabled();
    });

    test('is disabled when the control is disabled', async () => {
      const { fixture } = await renderWithClipboard();
      fixture.componentInstance.control.disable();
      fixture.detectChanges();
      await fixture.whenStable();
      expect(screen.getByRole('button', { name: COPY_DISABLED_LABEL })).toBeDisabled();
    });

    test('shows a check icon after copying, which disappears after 2 seconds', async () => {
      const { fixture } = await renderWithClipboard();
      vi.useFakeTimers();
      const button = screen.getByRole('button', { name: COPY_LABEL });
      expect(isCheckIconVisible(button)).toBe(false);
      fireEvent.click(button);
      fixture.detectChanges();
      expect(isCheckIconVisible(button)).toBe(true);
      vi.advanceTimersByTime(1999);
      fixture.detectChanges();
      expect(isCheckIconVisible(button)).toBe(true);
      vi.advanceTimersByTime(1);
      fixture.detectChanges();
      expect(isCheckIconVisible(button)).toBe(false);
    });

    test('restarts the check icon timeout when copying again', async () => {
      const { fixture } = await renderWithClipboard();
      vi.useFakeTimers();
      const button = screen.getByRole('button', { name: COPY_LABEL });
      fireEvent.click(button);
      vi.advanceTimersByTime(1500);
      fireEvent.click(button);
      vi.advanceTimersByTime(1500);
      fixture.detectChanges();
      expect(isCheckIconVisible(button)).toBe(true);
      vi.advanceTimersByTime(500);
      fixture.detectChanges();
      expect(isCheckIconVisible(button)).toBe(false);
    });

    test('does not show a check icon when copying failed', async () => {
      const { copy, fixture } = await renderWithClipboard(false);
      const button = screen.getByRole('button', { name: COPY_LABEL });
      fireEvent.click(button);
      fixture.detectChanges();
      expect(copy).toHaveBeenCalled();
      expect(isCheckIconVisible(button)).toBe(false);
    });

  });

});
