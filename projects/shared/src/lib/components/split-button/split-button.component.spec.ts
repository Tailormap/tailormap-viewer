import { render, screen } from '@testing-library/angular';
import { SplitButtonComponent } from './split-button.component';
import { SharedImportsModule } from '../../shared-imports.module';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { SharedModule } from '../../shared.module';
import userEvent from '@testing-library/user-event';

const setup = async () => {
  const optionSelectedMock = jest.fn();
  await render(SplitButtonComponent, {
    imports: [ SharedImportsModule, MatIconTestingModule, SharedModule ],
    inputs: {
      options: [{ id: '1', label: 'Test 1' }, { id: '2', label: 'Test 2' }],
      selectedOption: '1',
    },
    on: { optionSelected: optionSelectedMock },
  });
  return { optionSelectedMock };
};

describe('SplitButtonComponent', () => {

  test('should render', async () => {
    await setup();
    const buttons = screen.getAllByRole('radio');
    expect(buttons.length).toEqual(2);
    await userEvent.click(buttons[1]);
    const labels = await screen.findAllByText('Test 1');
    expect(labels.length).toEqual(2);
    const itemWrapper = labels[1].closest('.split-button-menu-item');
    expect(itemWrapper?.querySelector('mat-icon')).toBeInTheDocument();
    expect(await screen.getByText('Test 2'));
  });

  test('cycles through options', async () => {
    const { optionSelectedMock } = await setup();
    const buttons = screen.getAllByRole('radio');
    expect(await screen.getByText('Test 1'));
    await userEvent.click(buttons[0]);
    expect(optionSelectedMock).toHaveBeenCalledWith('2');
    expect(await screen.getByText('Test 2'));
    await userEvent.click(buttons[0]);
    expect(optionSelectedMock).toHaveBeenCalledWith('1');
    expect(await screen.getByText('Test 1'));
  });

});
