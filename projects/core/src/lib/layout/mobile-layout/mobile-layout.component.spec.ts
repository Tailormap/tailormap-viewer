import { render } from '@testing-library/angular';
import { BaseComponentTypeEnum } from '@tailormap-viewer/api';
import { provideMockStore } from '@ngrx/store/testing';
import { BaseLayoutComponent } from '../base-layout/base-layout.component';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { selectComponentsConfig } from '../../state/core.selectors';
import { selectIn3dView } from '../../map/state/map.selectors';

describe('MobileLayoutComponent', () => {

  const setup = async (disabledComponents?: BaseComponentTypeEnum[]) => {
    const store = provideMockStore({
      initialState: {},
      selectors: [
        {
          selector: selectComponentsConfig,
          value: (disabledComponents || []).map(type => ({ type, config: { enabled: false } } )),
        },
        { selector: selectIn3dView, value: false },
      ],
    });
    const { container } = await render(BaseLayoutComponent, {
      providers: [store],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    });
    return container;
  };

  test('should render', async () => {
    const container = await setup();
    expect(container.querySelector('tm-map')).toBeInTheDocument();
  });

});
