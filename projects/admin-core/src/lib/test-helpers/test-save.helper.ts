import { expect, vi } from 'vitest';
import { screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

export class TestSaveHelper {

  public static async waitForButtonToBeEnabledAndClick(labelText: string, idx?: number, ue?: ReturnType<typeof userEvent.setup>) {
    const btnIdx = typeof idx === 'number' ? idx : 0;
    await vi.waitFor(async () => {
      expect((await screen.findAllByLabelText(labelText))[btnIdx]).toBeEnabled();
    });
    await (ue || userEvent).click((await screen.findAllByLabelText(labelText))[btnIdx]);
  }

  public static async waitForButtonToBeDisabled(labelText: string, idx?: number) {
    const btnIdx = typeof idx === 'number' ? idx : 0;
    await vi.waitFor(async () => {
      expect((await screen.findAllByLabelText(labelText))[btnIdx]).toBeDisabled();
    });
  }

}
