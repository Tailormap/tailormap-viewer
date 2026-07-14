import { render, screen } from '@testing-library/angular';
import { TextFilterComponent } from './text-filter.component';
import { AttributeFilterModel, FilterConditionEnum, FilterTypeEnum, AttributeType, FilterToolEnum } from '@tailormap-viewer/api';
import { SharedImportsModule } from '@tailormap-viewer/shared';

const textFilter: AttributeFilterModel = {
  id: 'filter1',
  attributeType: AttributeType.STRING,
  attribute: 'name',
  condition: FilterConditionEnum.STRING_LIKE_KEY,
  value: ['G0'],
  invertCondition: false,
  caseSensitive: false,
  type: FilterTypeEnum.ATTRIBUTE,
  editConfiguration: {
    filterTool: FilterToolEnum.TEXT,
    condition: FilterConditionEnum.STRING_LIKE_KEY,
  },
};

describe('TextFilterComponent', () => {

  test('should render', async () => {
    await render(TextFilterComponent, {
      imports: [ SharedImportsModule ],
      inputs: { textFilter: textFilter },
    });
    expect(screen.getByRole('textbox'));
  });

});
