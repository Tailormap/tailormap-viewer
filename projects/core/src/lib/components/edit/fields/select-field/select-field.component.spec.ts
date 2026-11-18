import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { of } from 'rxjs';
import { provideMockStore } from '@ngrx/store/testing';
import { FormFieldTypeEnum, UniqueValuesService } from '@tailormap-viewer/api';
import { SelectFieldComponent } from './select-field.component';
import { ViewerEditFormFieldModel } from '../../models/viewer-edit-form-field.model';
import { selectViewerId } from '../../../../state/core.selectors';

const getItem = (overrides?: Partial<ViewerEditFormFieldModel>): ViewerEditFormFieldModel => ({
  name: 'soort',
  label: 'Soort',
  type: FormFieldTypeEnum.SELECT,
  value: 'merel',
  valueList: [{ value: 'mus', label: 'Mus' }],
  ...overrides,
});

const setup = async (item: ViewerEditFormFieldModel, uniqueValues: string[] = []) => {
  const getUniqueValues$ = vi.fn(() => of({ values: uniqueValues, filterApplied: false }));
  const { fixture } = await render(SelectFieldComponent, {
    inputs: { item, layerId: '1' },
    providers: [
      provideMockStore({ selectors: [{ selector: selectViewerId, value: 'app/default' }] }),
      { provide: UniqueValuesService, useValue: { getUniqueValues$, createKey: vi.fn() } },
    ],
  });
  fixture.detectChanges();
  await fixture.whenStable();
  return { getUniqueValues$ };
};

describe('SelectFieldComponent', () => {

  test('shows a current value that is not one of the choices', async () => {
    await setup(getItem());
    expect(screen.getByRole('combobox')).toHaveTextContent('merel');
    await userEvent.click(screen.getByRole('combobox'));
    expect(await screen.findByRole('option', { name: 'merel' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Mus' })).toBeInTheDocument();
  });

  test('shows a current value when there are no choices', async () => {
    await setup(getItem({ valueList: [] }));
    expect(screen.getByRole('combobox')).toHaveTextContent('merel');
  });

  test('does not add the current value twice when it is one of the choices', async () => {
    await setup(getItem({ value: 'mus' }));
    expect(screen.getByRole('combobox')).toHaveTextContent('Mus');
    await userEvent.click(screen.getByRole('combobox'));
    expect(await screen.findAllByRole('option')).toHaveLength(1);
  });

  test('keeps the current value when it is not in the unique values', async () => {
    const { getUniqueValues$ } = await setup(getItem({ uniqueValuesAsOptions: true, valueList: undefined }), [ 'mus', 'vink' ]);
    expect(screen.getByRole('combobox')).toHaveTextContent('merel');
    await userEvent.click(screen.getByRole('combobox'));
    expect(getUniqueValues$).toHaveBeenCalled();
    expect(await screen.findByRole('option', { name: 'vink' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'merel' })).toBeInTheDocument();
  });

});
