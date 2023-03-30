import { screen, waitFor } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

export class TestSaveHelper {

  public static async waitForButtonToBeEnabledAndClick(labelText: string, idx?: number) {
    const btnIdx = typeof idx === 'number' ? idx : 0;
    // @ts-ignore
    await waitFor(async () => {
      // eslint-disable-next-line no-undef
      expect((await screen.findAllByLabelText(labelText))[btnIdx]).toBeEnabled();
    });
    await userEvent.click((await screen.findAllByLabelText(labelText))[btnIdx]);
  }

  public static async waitForButtonToBeDisabled(labelText: string, idx?: number) {
    const btnIdx = typeof idx === 'number' ? idx : 0;
    // @ts-ignore
    await waitFor(async () => {
      // eslint-disable-next-line no-undef
      expect((await screen.findAllByLabelText(labelText))[btnIdx]).toBeDisabled();
    });
  }

}
