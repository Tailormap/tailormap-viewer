import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/angular';
import { provideMockStore } from '@ngrx/store/testing';
import { NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { of } from 'rxjs';
import userEvent from '@testing-library/user-event';
import { AttributeListTabToolbarComponent } from './attribute-list-tab-toolbar.component';
import {
  selectDataForSelectedTab, selectHasNoRowsForSelectedTab, selectLoadingDataSelectedTab, selectPagingDataSelectedTab,
  selectSelectedTab,
} from '../state/attribute-list.selectors';
import { AttributeListPagingHelper } from '../helpers/attribute-list-paging.helper';
import { AttributeListStateService } from '../services/attribute-list-state.service';
import { SimpleAttributeFilterService } from '../../../filter/services/simple-attribute-filter.service';
import { AttributeListFeatureRegistrationService } from '../services/attribute-list-feature-registration.service';
import { AttributeListDataService } from '../services/attribute-list-data.service';
import { AttributeListManagerService } from '../services/attribute-list-manager.service';
import { getMapServiceMock } from '../../../test-helpers/map-service.mock';
import { AttributeListExportButtonComponent } from '../attribute-list-export-button/attribute-list-export-button.component';

const setup = async (totalCount: number | null, pageIndex: number, rowCount: number) => {
  const updatePage = vi.fn();
  await render(AttributeListTabToolbarComponent, {
    providers: [
      provideMockStore({
        selectors: [
          { selector: selectLoadingDataSelectedTab, value: false },
          { selector: selectPagingDataSelectedTab, value: AttributeListPagingHelper.getPagingData('data-1', totalCount, pageIndex, 100, rowCount) },
          { selector: selectSelectedTab, value: null },
          { selector: selectDataForSelectedTab, value: null },
          { selector: selectHasNoRowsForSelectedTab, value: false },
        ],
      }),
      { provide: AttributeListStateService, useValue: { executeActionForCurrentData: (fn: (dataId: string) => void) => fn('data-1') } },
      { provide: SimpleAttributeFilterService, useValue: { hasFilter$: () => of(false), hasFiltersForOtherFeatureTypes$: () => of(false) } },
      { provide: AttributeListFeatureRegistrationService, useValue: { registeredAdditionalFeatures: signal([]) } },
      { provide: AttributeListDataService, useValue: { updatePage } },
      { provide: AttributeListManagerService, useValue: { canZoomToBounds: () => false } },
      getMapServiceMock().provider,
    ],
    configureTestBed: tb => tb.overrideComponent(AttributeListTabToolbarComponent, {
      remove: { imports: [AttributeListExportButtonComponent] },
      add: { schemas: [NO_ERRORS_SCHEMA] },
    }),
  });
  return { updatePage };
};

// The paginator buttons use disabledInteractive, so they are disabled with aria-disabled instead of the disabled attribute.
describe('AttributeListTabToolbarComponent', () => {

  test('shows the total when known', async () => {
    await setup(250, 1, 100);
    expect(await screen.findByText('1 - 100 of 250')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next page' })).not.toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('button', { name: 'Last page' })).toBeInTheDocument();
  });

  test('allows the next page when the total is unknown and the page is full', async () => {
    const { updatePage } = await setup(-1, 1, 100);
    expect(await screen.findByText('1 - 100 of unknown')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Last page' })).not.toBeInTheDocument();
    const next = screen.getByRole('button', { name: 'Next page' });
    expect(next).not.toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(next);
    expect(updatePage).toHaveBeenCalledWith('data-1', 2);
  });

  test('shows the derived total on the last page when the total is unknown', async () => {
    await setup(-1, 3, 42);
    expect(await screen.findByText('201 - 242 of 242')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next page' })).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('button', { name: 'Previous page' })).not.toHaveAttribute('aria-disabled', 'true');
  });

});
