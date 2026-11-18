import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { BaseComponentTypeEnum, SimpleSearchConfigModel } from '@tailormap-viewer/api';
import { SimpleSearchComponentConfigComponent } from './simple-search-component-config.component';
import { ComponentConfigurationService } from '../../services/component-configuration.service';
import { CadastralMunicipalityHelper, CadastralMunicipalityModel } from '@tailormap-viewer/shared';

const cadastralMunicipalities: CadastralMunicipalityModel[] = [
  { name: 'Aalburg', codes: ['ABG00'] },
  { name: 'Amsterdam', codes: [ 'ASD12', 'ASD02', 'ASD05' ] },
  { name: 'Asten', codes: ['ATN01'] },
  { name: 'Aalten', codes: ['ATN02'] },
];

const setup = async (config: SimpleSearchConfigModel = { enabled: true }) => {
  vi.spyOn(CadastralMunicipalityHelper, 'getCadastralMunicipalities').mockReturnValue(cadastralMunicipalities);
  const componentConfigService = { updateConfigForKey: vi.fn(), updateConfig: vi.fn() };
  await render(SimpleSearchComponentConfigComponent, {
    inputs: { type: BaseComponentTypeEnum.SIMPLE_SEARCH, label: 'Search', config },
    providers: [
      { provide: ComponentConfigurationService, useValue: componentConfigService },
    ],
  });
  return { updateConfigForKey: componentConfigService.updateConfigForKey };
};

const getDeleteButton = (label: string) => {
  const button = screen.getByText(label).nextElementSibling?.querySelector('button');
  expect(button).toBeTruthy();
  return button as HTMLButtonElement;
};

describe('SimpleSearchComponentConfigComponent', () => {

  test('saves the search cadastral parcels toggle and defaults to off', async () => {
    const { updateConfigForKey } = await setup();
    const toggle = screen.getByRole('switch', { name: /Search cadastral parcels/ });
    expect(toggle).not.toBeChecked();
    expect(screen.queryByText('Cadastral municipality filter')).not.toBeInTheDocument();
    await userEvent.click(toggle);
    expect(updateConfigForKey).toHaveBeenCalledWith(BaseComponentTypeEnum.SIMPLE_SEARCH, 'searchCadastralParcels', true);
    expect(await screen.findByText('Cadastral municipality filter')).toBeInTheDocument();
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

  test('autocomplete has one option per code (also for a name with several codes), matches on name and code and excludes selected entries', async () => {
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

});
