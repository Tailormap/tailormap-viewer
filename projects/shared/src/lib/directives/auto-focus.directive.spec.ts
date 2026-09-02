import { render, screen } from '@testing-library/angular';
import { AutoFocusDirective } from './auto-focus.directive';

describe('AutoFocusDirective', () => {

  beforeEach(() => {
    vi.useFakeTimers();
  });

  test('adds focus to textfield', async () => {
    await render('<input type="text" tmAutoFocus data-testid="input" />', {
      declarations: [AutoFocusDirective],
    });
    vi.runAllTimers();
    const inputField = screen.getByTestId('input');
    expect(inputField).toHaveFocus();
  });

  test('adds focus to a select element', async () => {
    await render('<select tmAutoFocus data-testid="select"><option value="1">1</option></select>', {
      declarations: [AutoFocusDirective],
    });
    vi.runAllTimers();
    const selectField = screen.getByTestId('select');
    expect(selectField).toHaveFocus();
  });

});
