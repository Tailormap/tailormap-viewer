import { screen, waitFor } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { AuthenticatedUserTestHelper } from './authenticated-user-test.helper.spec';

export class TestSaveHelper {

  public static async waitForButtonToBeEnabledAndClick(labelText: string, idx?: number, ue?: ReturnType<typeof userEvent.setup>) {
    const btnIdx = typeof idx === 'number' ? idx : 0;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    await waitFor(async () => {
      expect((await screen.findAllByLabelText(labelText))[btnIdx]).toBeEnabled();
    });
    await (ue || userEvent).click((await screen.findAllByLabelText(labelText))[btnIdx]);
  }

  public static async waitForButtonToBeDisabled(labelText: string, idx?: number) {
    const btnIdx = typeof idx === 'number' ? idx : 0;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    await waitFor(async () => {
      expect((await screen.findAllByLabelText(labelText))[btnIdx]).toBeDisabled();
    });
  }

}

// Dummy test to prevent "Your test suite must contain at least one test." error
describe('TestSaveHelper', () => {
  test('TestSaveHelper', () => {
    expect(1).toEqual(1);
  });
});

