import { render, screen } from '@testing-library/angular';
import { TocNodeDetailsMobileComponent } from './toc-node-details-mobile.component';

describe('TocNodeDetailsMobileComponent', () => {

  test('should render', async () => {
    await render(TocNodeDetailsMobileComponent);
    expect(screen.getByText('toc-node-details-mobile works!'));
  });

});
