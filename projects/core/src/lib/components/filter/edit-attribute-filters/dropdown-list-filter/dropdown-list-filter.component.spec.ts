import { render, screen } from '@testing-library/angular';
import { DropdownListFilterComponent } from './dropdown-list-filter.component';

describe('DropdownListFilterComponent', () => {

  test('should render', async () => {
    await render(DropdownListFilterComponent);
    expect(screen.getByText('dropdown-list-filter works!'));
  });

});
