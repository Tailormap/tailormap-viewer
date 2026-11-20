import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { BaseComponentTypeEnum, SimpleSearchConfigModel } from '@tailormap-viewer/api';
import { SimpleSearchComponentConfigComponent } from './simple-search-component-config.component';
import { ComponentConfigurationService } from '../../services/component-configuration.service';
import { loadCadastralMunicipalityList } from '@tailormap-viewer/shared';

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
    const aalten = { name: 'Aalten', codes: ['ATN02'] };
    const amsterdam = { name: 'Amsterdam', codes: [ 'ASD02', 'ASD03' ] };
    const { updateConfigForKey } = await setup({
      enabled: true,
      searchCadastralParcels: true,
      cadastralMunicipalities: [ aalten, amsterdam ],
    });
    expect(screen.getByRole('switch', { name: /Search cadastral parcels/ })).toBeChecked();
    expect(await screen.findByText('Aalten')).toBeInTheDocument();
    expect(screen.getByText('Amsterdam')).toBeInTheDocument();
    await userEvent.click(getDeleteButton('Amsterdam'));
    expect(updateConfigForKey).toHaveBeenCalledWith(BaseComponentTypeEnum.SIMPLE_SEARCH, 'cadastralMunicipalities', [aalten]);
  });

  test('autocomplete matches on name, excludes selected names and saves the chosen name with its codes', async () => {
    const aalburg = { name: 'Aalburg', codes: ['ABG00'] };
    const { updateConfigForKey } = await setup({
      enabled: true,
      searchCadastralParcels: true,
      cadastralMunicipalities: [aalburg],
    });
    const input = await screen.findByRole('combobox', { name: 'Cadastral municipality' });
    await userEvent.type(input, 'aal');
    expect(await screen.findByRole('option', { name: 'Aalten' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Aalburg' })).not.toBeInTheDocument();
    await userEvent.clear(input);
    await userEvent.type(input, 'amsterdam');
    await vi.waitFor(() => expect(screen.getAllByRole('option').map(o => o.textContent?.trim())).toEqual(['Amsterdam']));
    await userEvent.click(screen.getByRole('option', { name: 'Amsterdam' }));
    const amsterdam = (await loadCadastralMunicipalityList()).find(m => m.name === 'Amsterdam');
    expect(amsterdam?.codes).toContain('ASD02');
    expect(updateConfigForKey).toHaveBeenLastCalledWith(BaseComponentTypeEnum.SIMPLE_SEARCH, 'cadastralMunicipalities', [ aalburg, amsterdam ]);
    expect(input).toHaveValue('');
  });

});
