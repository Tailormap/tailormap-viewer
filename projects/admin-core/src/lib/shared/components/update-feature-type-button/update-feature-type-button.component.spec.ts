import { render, screen } from '@testing-library/angular';
import { UpdateFeatureTypeButtonComponent } from './update-feature-type-button.component';
import { FeatureTypeUpdateService } from '../../../catalog/services/feature-type-update.service';
import { of } from 'rxjs';
import { CatalogExtendedTypeEnum } from '../../../catalog/models/catalog-extended.model';
import { ExtendedFeatureTypeModel } from '../../../catalog/models/extended-feature-type.model';
import userEvent from '@testing-library/user-event';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { SharedModule, TooltipDirective } from '@tailormap-viewer/shared';

const setup = async (updateSuccess: boolean) => {
  const featureTypeUpdated = jest.fn();
  const featureType: ExtendedFeatureTypeModel = {
    featureSourceId: "1",
    type: CatalogExtendedTypeEnum.FEATURE_TYPE_TYPE,
    title: "begroeidterreindeel",
    originalId: "1",
    name: "abc",
    id: "1",
    hasAttributes: false,
    catalogNodeId: "",
  };
  const updateFeatureTypeSetting$Mock = jest.fn(() => of(updateSuccess ? featureType : null));
  await render(UpdateFeatureTypeButtonComponent, {
    imports: [ SharedModule, MatIconTestingModule ],
    // declarations: [TooltipDirective],
    componentProperties: { featureType, featureTypeUpdated: { emit: featureTypeUpdated } as any },
    providers: [{ provide: FeatureTypeUpdateService, useValue: { updateFeatureTypeSetting$: updateFeatureTypeSetting$Mock } }],
  });
  return { updateFeatureTypeSetting: updateFeatureTypeSetting$Mock, featureTypeUpdated };
};

describe('UpdateFeatureTypeButtonComponent', () => {

  test('should render - no update', async () => {
    const { featureTypeUpdated, updateFeatureTypeSetting } = await setup(false);
    expect(await screen.findByText('begroeidterreindeel')).toBeInTheDocument();
    await userEvent.click(await screen.findByText('begroeidterreindeel'));
    expect(updateFeatureTypeSetting).toHaveBeenCalledWith("1", 1);
    expect(featureTypeUpdated).not.toHaveBeenCalled();
  });

  test('should render - success', async () => {
    const { featureTypeUpdated, updateFeatureTypeSetting } = await setup(true);
    expect(await screen.findByText('begroeidterreindeel')).toBeInTheDocument();
    await userEvent.click(await screen.findByText('begroeidterreindeel'));
    expect(updateFeatureTypeSetting).toHaveBeenCalledWith("1", 1);
    expect(featureTypeUpdated).toHaveBeenCalled();
  });

});
