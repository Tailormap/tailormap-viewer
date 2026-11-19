import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { BaseComponentTypeEnum, SimpleSearchConfigModel } from '@tailormap-viewer/api';
import { SimpleSearchComponentConfigComponent } from './simple-search-component-config.component';
import { ComponentConfigurationService } from '../../services/component-configuration.service';
import { CADASTRAL_MUNICIPALITY_LIST } from '@tailormap-viewer/shared';

const setup = async (config: SimpleSearchConfigModel = { enabled: true }) => {
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

  test('shows the selected kadastrale gemeenten and deletes one', async () => {
    const { updateConfigForKey } = await setup({
      enabled: true,
      searchCadastralParcels: true,
      cadastralMunicipalities: [ 'Aalten', "'s-Gravenhage", 'Amsterdam' ],
    });
    expect(screen.getByRole('switch', { name: /Search cadastral parcels/ })).toBeChecked();
    expect(await screen.findByText('Aalten')).toBeInTheDocument();
    expect(screen.getByText("'s-Gravenhage")).toBeInTheDocument();
    expect(screen.getByText('Amsterdam')).toBeInTheDocument();
    await userEvent.click(getDeleteButton('Amsterdam'));
    expect(updateConfigForKey).toHaveBeenCalledWith(BaseComponentTypeEnum.SIMPLE_SEARCH, 'cadastralMunicipalities', [ 'Aalten', "'s-Gravenhage" ]);
  });

  test('shows and deletes selected names that are not in the list', async () => {
    const { updateConfigForKey } = await setup({
      enabled: true,
      searchCadastralParcels: true,
      cadastralMunicipalities: [ 'Aalten', 'ATN02' ],
    });
    expect(await screen.findByText('ATN02')).toBeInTheDocument();
    await userEvent.click(getDeleteButton('ATN02'));
    expect(updateConfigForKey).toHaveBeenCalledWith(BaseComponentTypeEnum.SIMPLE_SEARCH, 'cadastralMunicipalities', ['Aalten']);
  });

  test('autocomplete matches on name, excludes selected names and saves the chosen name', async () => {
    const { updateConfigForKey } = await setup({
      enabled: true,
      searchCadastralParcels: true,
      cadastralMunicipalities: ['Aalburg'],
    });
    expect(CADASTRAL_MUNICIPALITY_LIST.map(m => m.name)).toContain('Aalburg');
    const input = await screen.findByRole('combobox', { name: 'Cadastral municipality' });
    await userEvent.type(input, 'aal');
    expect(await screen.findByRole('option', { name: 'Aalten' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Aalburg' })).not.toBeInTheDocument();
    await userEvent.clear(input);
    await userEvent.type(input, 'amsterdam');
    await vi.waitFor(() => expect(screen.getAllByRole('option').map(o => o.textContent?.trim())).toEqual(['Amsterdam']));
    await userEvent.click(screen.getByRole('option', { name: 'Amsterdam' }));
    expect(updateConfigForKey).toHaveBeenLastCalledWith(BaseComponentTypeEnum.SIMPLE_SEARCH, 'cadastralMunicipalities', [ 'Aalburg', 'Amsterdam' ]);
    expect(input).toHaveValue('');
  });

});
