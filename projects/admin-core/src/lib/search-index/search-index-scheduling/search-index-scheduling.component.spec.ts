import { render, screen } from '@testing-library/angular';
import { SearchIndexSchedulingComponent } from './search-index-scheduling.component';

describe('SearchIndexSchedulingComponent', () => {

  test('should render', async () => {
    await render(SearchIndexSchedulingComponent);
    expect(screen.getByText('search-index-scheduling works!'));
  });

});
