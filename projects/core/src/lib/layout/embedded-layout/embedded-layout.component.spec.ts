import { render } from '@testing-library/angular';
import { EmbeddedLayoutComponent } from './embedded-layout.component';
import { provideMockStore } from '@ngrx/store/testing';
import { selectComponentsConfig } from '../../state/core.selectors';
import { BaseComponentTypeEnum } from '@tailormap-viewer/api';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

describe('EmbeddedLayoutComponent', () => {

  const setup = async (disabledComponents?: BaseComponentTypeEnum[]) => {
    const store = provideMockStore({
      initialState: {},
      selectors: [
        {
          selector: selectComponentsConfig,
          value: (disabledComponents || []).map(type => ({ type, config: { enabled: false } } )),
        },
      ],
    });
    const { container } = await render(EmbeddedLayoutComponent, {
      providers: [store],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    });
    return container;
  };

  test('should render', async () => {
    const container = await setup();
    expect(container.querySelector('tm-map')).toBeInTheDocument();
    expect(container.querySelector('tm-simple-search')).toBeInTheDocument();
  });

  test('does not render disabled components', async () => {
    const container = await setup([BaseComponentTypeEnum.SIMPLE_SEARCH]);
    expect(container.querySelector('tm-map')).toBeInTheDocument();
    expect(container.querySelector('tm-simple-search')).not.toBeInTheDocument();
  });

});
