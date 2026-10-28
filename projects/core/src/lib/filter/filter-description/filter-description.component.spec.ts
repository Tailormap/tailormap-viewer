import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/angular';
import { FilterDescriptionComponent } from './filter-description.component';
import { getAppLayerModel } from '@tailormap-viewer/api';
import { AttributeFilterModel, AttributeType, FilterConditionEnum } from '@tailormap-viewer/api';
import { ExtendedFilterGroupModel } from '../models/extended-filter-group.model';
import { getFilterGroup } from '@tailormap-viewer/shared';

describe('FilterDescriptionComponent', () => {

  it('should create', async () => {
    const filterGroup: ExtendedFilterGroupModel<AttributeFilterModel> = {
      ...getFilterGroup(),
      layers: [getAppLayerModel({ id: '1', title: 'layer1' })],
    };
    await render(FilterDescriptionComponent, { inputs: { filterGroup } });
    expect(await screen.findByText('attribute')).toBeInTheDocument();
    expect(await screen.findByText('contains')).toBeInTheDocument();
    expect(await screen.findByText('value')).toBeInTheDocument();
  });

  it('joins multiple filters with the group operator', async () => {
    const baseFilter = getFilterGroup().filters[0];
    const filterGroup: ExtendedFilterGroupModel<AttributeFilterModel> = {
      ...getFilterGroup([
        baseFilter,
        { ...baseFilter, id: '2', attribute: 'other', value: ['other value'] },
      ]),
      operator: 'OR',
      layers: [getAppLayerModel({ id: '1', title: 'layer1' })],
    };
    const { container } = await render(FilterDescriptionComponent, { inputs: { filterGroup } });
    expect(container.textContent?.replace(/\s+/g, ' ')).toContain('attribute contains value or other contains other value');
    expect(await screen.findByText('other')).toBeInTheDocument();
    expect(await screen.findByText('or')).toBeInTheDocument();
  });

  it('renders attribute alias and two values joined by and', async () => {
    const filterGroup: ExtendedFilterGroupModel<AttributeFilterModel> = {
      ...getFilterGroup([{
        ...getFilterGroup().filters[0],
        attributeAlias: 'Alias',
        attributeType: AttributeType.INTEGER,
        condition: FilterConditionEnum.NUMBER_BETWEEN_KEY,
        value: [ '1', '5' ],
      }]),
      layers: [],
    };
    await render(FilterDescriptionComponent, { inputs: { filterGroup } });
    expect(await screen.findByText('Alias')).toBeInTheDocument();
    expect(await screen.findByText('1 and 5')).toBeInTheDocument();
  });

  it('does not interpret HTML in values', async () => {
    const filterGroup: ExtendedFilterGroupModel<AttributeFilterModel> = {
      ...getFilterGroup([{ ...getFilterGroup().filters[0], value: ['<img src=x onerror=alert(1)>'] }]),
      layers: [],
    };
    const { container } = await render(FilterDescriptionComponent, { inputs: { filterGroup } });
    expect(container.querySelector('img')).toBeNull();
    expect(await screen.findByText('<img src=x onerror=alert(1)>')).toBeInTheDocument();
  });

  it('renders nothing without attribute filters', async () => {
    const filterGroup: ExtendedFilterGroupModel<AttributeFilterModel> = {
      ...getFilterGroup([]),
      layers: [],
    };
    await render(FilterDescriptionComponent, { inputs: { filterGroup } });
    expect(screen.queryByText('Summary')).not.toBeInTheDocument();
  });

});
