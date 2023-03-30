import { render, screen } from '@testing-library/angular';
import { TriStateBooleanComponent } from './tri-state-boolean.component';
import { MatButtonToggleModule } from '@angular/material/button-toggle';

describe('TriStateBooleanComponent', () => {

  test('should render', async () => {
    await render(TriStateBooleanComponent, {
      imports: [MatButtonToggleModule],
      componentProperties: {
        value: true,
        labelDefault: 'Default',
        labelEnabled: 'True',
        labelDisabled: 'Disabled',
      },
    });
    expect(await screen.findByText('Default')).toBeInTheDocument();
    expect(await screen.findByText('True')).toBeInTheDocument();
    expect(await screen.findByText('Disabled')).toBeInTheDocument();
  });

  test('should handle change', async () => {
    const changed = jest.fn();
    await render(TriStateBooleanComponent, {
      imports: [MatButtonToggleModule],
      componentProperties: {
        value: true,
        changed: { emit: changed } as any,
      },
    });
    const toggle = await screen.findByRole('button', { name: 'Disabled' });
    toggle.click();
    expect(changed).toHaveBeenCalledWith(false);
  });

});
