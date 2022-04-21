import { render, screen } from '@testing-library/angular';
import { SplitButtonComponent } from './split-button.component';
import { SharedImportsModule } from '../../shared-imports.module';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import userEvent from '@testing-library/user-event';

describe('SplitButtonComponent', () => {

  test('should render', async () => {
    await render(SplitButtonComponent, {
      imports: [ SharedImportsModule, MatIconTestingModule ],
      componentProperties: {
        options: [{ id: '1', label: 'Test 1' }, { id: '2', label: 'Test 2' }],
      },
    });
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toEqual(2);
    userEvent.click(buttons[1]);
    expect(await screen.getByText('Test 1'));
    expect(await screen.getByText('Test 2'));
  });

  test('cycles through options', async () => {
    const optionSelectedMock = jest.fn();
    await render(SplitButtonComponent, {
      imports: [ SharedImportsModule, MatIconTestingModule ],
      componentProperties: {
        options: [{ id: '1', label: 'Test 1' }, { id: '2', label: 'Test 2' }],
        selectedOption: '1',
        optionSelected: {
          emit: optionSelectedMock,
        } as any,
      },
    });
    const buttons = screen.getAllByRole('button');
    expect(await screen.getByText('Test 1'));
    userEvent.click(buttons[0]);
    expect(optionSelectedMock).toHaveBeenCalledWith('2');
    expect(await screen.getByText('Test 2'));
    userEvent.click(buttons[0]);
    expect(optionSelectedMock).toHaveBeenCalledWith('1');
    expect(await screen.getByText('Test 1'));
  });

});
