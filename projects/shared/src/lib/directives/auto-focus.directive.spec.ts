import { render, screen } from '@testing-library/angular';
import { AutoFocusDirective } from './auto-focus.directive';

describe('AutoFocusDirective', () => {

  beforeEach(() => {
    jest.useFakeTimers();
  });

  test('does not add focus if autoFocus is 0', async () => {
    await render('<input type="text" [tmAutoFocus]="0" data-testid="input" />', {
      declarations: [AutoFocusDirective],
    });
    jest.runAllTimers();
    const inputField = screen.getByTestId('input');
    expect(inputField).not.toHaveFocus();
  });

  test('adds focus if autoFocus is 1', async () => {
    await render('<input type="text" [tmAutoFocus]="1" data-testid="input" />', {
      declarations: [AutoFocusDirective],
    });
    jest.runAllTimers();
    const inputField = screen.getByTestId('input');
    expect(inputField).toHaveFocus();
  });

  test('adds focus to a select element', async () => {
    await render('<select [tmAutoFocus]="1" data-testid="select"><option value="1">1</option></select>', {
      declarations: [AutoFocusDirective],
    });
    jest.runAllTimers();
    const selectField = screen.getByTestId('select');
    expect(selectField).toHaveFocus();
  });

});
