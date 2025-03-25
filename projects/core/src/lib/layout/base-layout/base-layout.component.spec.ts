import { render } from '@testing-library/angular';
import { BaseLayoutComponent } from './base-layout.component';
import { provideMockStore } from '@ngrx/store/testing';
import { selectComponentsConfig } from '../../state/core.selectors';
import { BaseComponentTypeEnum } from '@tailormap-viewer/api';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { selectIn3dView } from '../../map/state/map.selectors';

describe('BaseLayoutComponent', () => {

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
    expect(container.querySelector('tm-drawing')).toBeInTheDocument();
  });

  test('does not render disabled components', async () => {
    const container = await setup([BaseComponentTypeEnum.DRAWING]);
    expect(container.querySelector('tm-map')).toBeInTheDocument();
    expect(container.querySelector('tm-drawing')).not.toBeInTheDocument();
  });

});
