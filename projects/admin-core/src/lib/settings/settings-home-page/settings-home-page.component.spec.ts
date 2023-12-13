import { render, screen } from '@testing-library/angular';
import { SettingsHomePageComponent } from './settings-home-page.component';

describe('SettingsHomePageComponent', () => {

  test('should render', async () => {
    await render(SettingsHomePageComponent);
    expect(screen.getByText('Select settings category from the left side'));
  });

});
