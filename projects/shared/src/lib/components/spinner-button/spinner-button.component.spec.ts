import { render, screen } from '@testing-library/angular';
import { SpinnerButtonComponent } from './spinner-button.component';
import { of } from 'rxjs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import userEvent, { PointerEventsCheckLevel } from '@testing-library/user-event';
import { SharedImportsModule } from '../../shared-imports.module';

const setup = async (isSpinning: boolean, disabled: boolean) => {
  const btnClick = jest.fn();
  await render(SpinnerButtonComponent, {
    imports: [ MatProgressSpinnerModule, SharedImportsModule ],
    inputs: {
      showSpinner$: of(isSpinning),
      label: 'My Button',
      disabled,
      color: 'primary',
    },
    on: { buttonClick: btnClick },
  });
  return { btnClick: btnClick };
};

describe('SpinnerButtonComponent', () => {

  test('should render', async () => {
    const { btnClick } = await setup(false, false);
    expect(await screen.findByText('My Button')).toBeInTheDocument();
    expect(await screen.findByRole('button')).not.toBeDisabled();
    await userEvent.click(await screen.findByRole('button'));
    expect(btnClick).toHaveBeenCalledTimes(1);
  });

  test('should spinner while saving', async () => {
    const { btnClick } = await setup(true, false);
    expect(await screen.queryByText('My Button')).not.toBeInTheDocument();
    expect(await screen.findByRole('progressbar')).toBeInTheDocument();
    expect(await screen.findByRole('button')).toBeDisabled();
    await userEvent.click(await screen.findByRole('button'), { pointerEventsCheck: PointerEventsCheckLevel.Never });
    expect(btnClick).not.toHaveBeenCalled();
  });

  test('should be disabled', async () => {
    const { btnClick } = await setup(false, true);
    expect(await screen.findByText('My Button')).toBeInTheDocument();
    expect(await screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(await screen.findByRole('button')).toBeDisabled();
    await userEvent.click(await screen.findByRole('button'), { pointerEventsCheck: PointerEventsCheckLevel.Never });
    expect(btnClick).not.toHaveBeenCalled();
  });

});
