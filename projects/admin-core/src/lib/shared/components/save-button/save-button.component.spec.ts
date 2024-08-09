import { render, screen } from '@testing-library/angular';
import { SaveButtonComponent } from './save-button.component';
import { of } from 'rxjs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import userEvent, { PointerEventsCheckLevel } from '@testing-library/user-event';
import { SharedImportsModule, SpinnerButtonComponent } from '@tailormap-viewer/shared';

const setup = async (isSaving: boolean, disabled: boolean) => {
  const saveFn = jest.fn();
  await render(SaveButtonComponent, {
    imports: [ MatProgressSpinnerModule, SharedImportsModule ],
    declarations: [SpinnerButtonComponent],
    componentInputs: {
      saving$: of(isSaving),
      disabled,
    },
    componentProperties: {
      save: {
        emit: saveFn,
      } as any,
    },
  });
  return { onSave: saveFn };
};

describe('SaveButtonComponent', () => {

  test('should render', async () => {
    const { onSave } = await setup(false, false);
    expect(await screen.findByText('Save')).toBeInTheDocument();
    expect(await screen.findByRole('button')).not.toBeDisabled();
    await userEvent.click(await screen.findByRole('button'));
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  test('should spinner while saving', async () => {
    const { onSave } = await setup(true, false);
    expect(await screen.queryByText('Save')).not.toBeInTheDocument();
    expect(await screen.findByRole('progressbar')).toBeInTheDocument();
    expect(await screen.findByRole('button')).toBeDisabled();
    await userEvent.click(await screen.findByRole('button'), { pointerEventsCheck: PointerEventsCheckLevel.Never });
    expect(onSave).not.toHaveBeenCalled();
  });

  test('should be disabled', async () => {
    const { onSave } = await setup(false, true);
    expect(await screen.findByText('Save')).toBeInTheDocument();
    expect(await screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(await screen.findByRole('button')).toBeDisabled();
    await userEvent.click(await screen.findByRole('button'), { pointerEventsCheck: PointerEventsCheckLevel.Never });
    expect(onSave).not.toHaveBeenCalled();
  });

});
