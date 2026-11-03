import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/angular';
import { LayerSettingsFormComponent } from './layer-settings-form.component';
import userEvent from '@testing-library/user-event';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { GeoServiceProtocolEnum, LayerSettingsModel, TailormapAdminApiV1Service } from '@tailormap-admin/admin-api';
import { of } from 'rxjs';
import { provideMockStore } from '@ngrx/store/testing';
import { initialUserState, userStateKey } from '../../user/state/user.state';
import { AuthenticatedUserTestHelper } from '../../test-helpers/authenticated-user-test.helper.spec';
import { catalogStateKey, initialCatalogState } from '../state/catalog.state';

describe('LayerSettingsFormComponent', () => {

  test('should render', async () => {
    const store = provideMockStore({
      initialState: { [userStateKey]: initialUserState, [catalogStateKey]: initialCatalogState },
    });

    const changedFn = vi.fn();
    await render(LayerSettingsFormComponent, {
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        store,
        { provide: TailormapAdminApiV1Service, useValue: { getGroups$: vi.fn(() => of(null)) } },
        AuthenticatedUserTestHelper.provideAuthenticatedUserServiceWithAdminUser(),
      ],
      inputs: { isLayerSpecific: true, protocol: GeoServiceProtocolEnum.WMTS },
      on: { changed: changedFn },
    });
    await userEvent.type(await screen.findByPlaceholderText('Title'), 'Some title');
    await vi.waitFor(() => {
      expect(changedFn).toHaveBeenCalledTimes(1);
      expect(changedFn).toHaveBeenCalledWith({
        attribution: undefined,
        authorizationRules: [],
        description: undefined,
        extraKeywords: [],
        featureType: undefined,
        hiDpiDisabled: undefined,
        hiDpiMode: undefined,
        tilingDisabled: undefined,
        tilingGutter: undefined,
        hiDpiSubstituteLayer: undefined,
        hiddenKeywords: [],
        legendImageId: undefined,
        title: 'Some title',
      });
    });
    await userEvent.click(await screen.findByText('Disabled'));
    await vi.waitFor(() => {
      expect(changedFn).toHaveBeenCalledTimes(2);
      expect(changedFn).toHaveBeenNthCalledWith(2, {
        attribution: undefined,
        authorizationRules: [],
        description: undefined,
        extraKeywords: [],
        featureType: undefined,
        hiDpiDisabled: true,
        hiDpiMode: undefined,
        tilingDisabled: undefined,
        tilingGutter: undefined,
        hiDpiSubstituteLayer: undefined,
        hiddenKeywords: [],
        legendImageId: undefined,
        title: 'Some title',
      });
    });
  });

  test('should emit descriptionInPopup for a specific layer', async () => {
    const changedFn = vi.fn();
    await setupForm({ isLayerSpecific: true, changedFn });
    const checkbox = await screen.findByRole('checkbox', { name: 'Show description in a pop-up' });
    expect(checkbox).not.toBeChecked();
    await userEvent.click(checkbox);
    await vi.waitFor(() => {
      expect(changedFn).toHaveBeenCalledTimes(1);
      expect(changedFn).toHaveBeenCalledWith(expect.objectContaining({ descriptionInPopup: true }));
    });
  });

  test('should show descriptionInPopup from the layer settings as checked', async () => {
    await setupForm({ isLayerSpecific: true, layerSettings: { descriptionInPopup: true } });
    expect(await screen.findByRole('checkbox', { name: 'Show description in a pop-up' })).toBeChecked();
  });

  test('should not show descriptionInPopup for the default layer settings of a service', async () => {
    await setupForm({ isLayerSpecific: false });
    expect(screen.queryByRole('checkbox', { name: 'Show description in a pop-up' })).not.toBeInTheDocument();
  });

});

const setupForm = async (opts: { isLayerSpecific: boolean; layerSettings?: LayerSettingsModel; changedFn?: () => void }) => {
  const store = provideMockStore({
    initialState: { [userStateKey]: initialUserState, [catalogStateKey]: initialCatalogState },
  });
  await render(LayerSettingsFormComponent, {
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    providers: [
      store,
      { provide: TailormapAdminApiV1Service, useValue: { getGroups$: vi.fn(() => of(null)) } },
      AuthenticatedUserTestHelper.provideAuthenticatedUserServiceWithAdminUser(),
    ],
    inputs: {
      isLayerSpecific: opts.isLayerSpecific,
      protocol: GeoServiceProtocolEnum.WMS,
      layerSettings: opts.layerSettings,
    },
    on: { changed: opts.changedFn ?? vi.fn() },
  });
};
