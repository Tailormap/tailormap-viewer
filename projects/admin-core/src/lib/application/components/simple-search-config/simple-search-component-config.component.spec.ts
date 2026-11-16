import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { BaseComponentTypeEnum, SimpleSearchConfigModel } from '@tailormap-viewer/api';
import { SimpleSearchComponentConfigComponent } from './simple-search-component-config.component';
import { ComponentConfigurationService } from '../../services/component-configuration.service';
import { CadastralMunicipalityModel, TailormapAdminApiV1Service } from '@tailormap-admin/admin-api';
import { Observable, of, Subject, throwError } from 'rxjs';

const cadastralMunicipalities: CadastralMunicipalityModel[] = [
  { code: 'ABG00', name: 'Aalburg' },
  { code: 'ASD02', name: 'Amsterdam' },
  { code: 'ASD05', name: 'Amsterdam' },
  { code: 'ASD12', name: 'Amsterdam' },
  { code: 'ATN01', name: 'Asten' },
  { code: 'ATN02', name: 'Aalten' },
];

const setup = async (
  config: SimpleSearchConfigModel = { enabled: true },
  cadastralMunicipalities$: Observable<CadastralMunicipalityModel[]> = of(cadastralMunicipalities),
) => {
  const componentConfigService = { updateConfigForKey: vi.fn(), updateConfig: vi.fn() };
  const adminApiService = { getCadastralMunicipalities$: vi.fn(() => cadastralMunicipalities$) };
  await render(SimpleSearchComponentConfigComponent, {
    inputs: { type: BaseComponentTypeEnum.SIMPLE_SEARCH, label: 'Search', config },
    providers: [
      { provide: ComponentConfigurationService, useValue: componentConfigService },
      { provide: TailormapAdminApiV1Service, useValue: adminApiService },
    ],
  });
  return { updateConfigForKey: componentConfigService.updateConfigForKey, getCadastralMunicipalities$: adminApiService.getCadastralMunicipalities$ };
};

const getDeleteButton = (label: string) => {
  const button = screen.getByText(label).nextElementSibling?.querySelector('button');
  expect(button).toBeTruthy();
  return button as HTMLButtonElement;
};

describe('SimpleSearchComponentConfigComponent', () => {

  test('saves the search cadastral parcels toggle, defaults to off, and only fetches the list when on', async () => {
    const { updateConfigForKey, getCadastralMunicipalities$ } = await setup();
    const toggle = screen.getByRole('switch', { name: /Search cadastral parcels/ });
    expect(toggle).not.toBeChecked();
    expect(screen.queryByText('Cadastral municipality filter')).not.toBeInTheDocument();
    expect(getCadastralMunicipalities$).not.toHaveBeenCalled();
    await userEvent.click(toggle);
    expect(updateConfigForKey).toHaveBeenCalledWith(BaseComponentTypeEnum.SIMPLE_SEARCH, 'searchCadastralParcels', true);
    expect(await screen.findByText('Cadastral municipality filter')).toBeInTheDocument();
    expect(getCadastralMunicipalities$).toHaveBeenCalledTimes(1);
  });

  test('shows the selected kadastrale gemeenten and deletes only one code', async () => {
    const { updateConfigForKey } = await setup({
      enabled: true,
      searchCadastralParcels: true,
      cadastralMunicipalities: [ 'ATN02', 'ASD02', 'ASD05' ],
    });
    expect(screen.getByRole('switch', { name: /Search cadastral parcels/ })).toBeChecked();
    expect(await screen.findByText('Aalten (ATN02)')).toBeInTheDocument();
    expect(screen.getByText('Amsterdam (ASD02)')).toBeInTheDocument();
    expect(screen.getByText('Amsterdam (ASD05)')).toBeInTheDocument();
    await userEvent.click(getDeleteButton('Amsterdam (ASD05)'));
    expect(updateConfigForKey).toHaveBeenCalledWith(BaseComponentTypeEnum.SIMPLE_SEARCH, 'cadastralMunicipalities', [ 'ATN02', 'ASD02' ]);
  });

  test('shows selected codes that are not in the list as bare code', async () => {
    const { updateConfigForKey } = await setup({
      enabled: true,
      searchCadastralParcels: true,
      cadastralMunicipalities: [ 'ATN02', 'BWW00' ],
    });
    expect(await screen.findByText('Aalten (ATN02)')).toBeInTheDocument();
    await userEvent.click(getDeleteButton('BWW00'));
    expect(updateConfigForKey).toHaveBeenCalledWith(BaseComponentTypeEnum.SIMPLE_SEARCH, 'cadastralMunicipalities', ['ATN02']);
  });

  test('autocomplete has one option per code, matches on name and code and excludes selected entries', async () => {
    const { updateConfigForKey } = await setup({
      enabled: true,
      searchCadastralParcels: true,
      cadastralMunicipalities: ['ABG00'],
    });
    const input = await screen.findByRole('combobox', { name: 'Cadastral municipality' });
    await userEvent.type(input, 'atn');
    expect(await screen.findByRole('option', { name: 'Aalten (ATN02)' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Asten (ATN01)' })).toBeInTheDocument();
    await userEvent.clear(input);
    await userEvent.type(input, 'aalburg');
    await vi.waitFor(() => expect(screen.queryByRole('option', { name: 'Aalburg (ABG00)' })).not.toBeInTheDocument());
    await userEvent.clear(input);
    await userEvent.type(input, 'asd05');
    expect(await screen.findByRole('option', { name: 'Amsterdam (ASD05)' })).toBeInTheDocument();
    expect(screen.getAllByRole('option')).toHaveLength(1);
    await userEvent.clear(input);
    await userEvent.type(input, 'Amsterdam');
    await vi.waitFor(() => expect(screen.getAllByRole('option').map(o => o.textContent?.trim()))
      .toEqual([ 'Amsterdam (ASD02)', 'Amsterdam (ASD05)', 'Amsterdam (ASD12)' ]));
    await userEvent.click(screen.getByRole('option', { name: 'Amsterdam (ASD05)' }));
    expect(updateConfigForKey).toHaveBeenLastCalledWith(BaseComponentTypeEnum.SIMPLE_SEARCH, 'cadastralMunicipalities', [ 'ABG00', 'ASD05' ]);
  });

  test('shows a loading message until the list arrives', async () => {
    const list$ = new Subject<CadastralMunicipalityModel[]>();
    await setup({ enabled: true, searchCadastralParcels: true }, list$);
    expect(await screen.findByText('Loading cadastral municipalities…')).toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: 'Cadastral municipality' })).not.toBeInTheDocument();
    list$.next(cadastralMunicipalities);
    list$.complete();
    expect(await screen.findByRole('combobox', { name: 'Cadastral municipality' })).toBeInTheDocument();
    expect(screen.queryByText('Loading cadastral municipalities…')).not.toBeInTheDocument();
  });

  test('shows an error message when the list cannot be loaded, selected codes can still be deleted', async () => {
    const { updateConfigForKey } = await setup(
      { enabled: true, searchCadastralParcels: true, cadastralMunicipalities: [ 'ATN02', 'ABG00' ] },
      throwError(() => new Error('503')),
    );
    expect(await screen.findByText('Could not load the list of cadastral municipalities.')).toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: 'Cadastral municipality' })).not.toBeInTheDocument();
    await userEvent.click(getDeleteButton('ATN02'));
    expect(updateConfigForKey).toHaveBeenCalledWith(BaseComponentTypeEnum.SIMPLE_SEARCH, 'cadastralMunicipalities', ['ABG00']);
  });

});
