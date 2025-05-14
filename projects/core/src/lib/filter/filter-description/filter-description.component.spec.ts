import { render, screen } from '@testing-library/angular';
import { FilterDescriptionComponent } from './filter-description.component';
import { getAppLayerModel } from '@tailormap-viewer/api';
import { AttributeFilterModel } from '@tailormap-viewer/api';
import { ExtendedFilterGroupModel } from '../models/extended-filter-group.model';
import { getFilterGroup } from '../../../../../shared/src/lib/helpers/attribute-filter.helper.spec';

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

});
