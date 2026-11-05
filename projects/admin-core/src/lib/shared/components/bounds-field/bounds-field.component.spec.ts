import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/angular';
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

});
