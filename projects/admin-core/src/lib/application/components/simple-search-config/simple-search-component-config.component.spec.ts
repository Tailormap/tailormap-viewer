import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { BaseComponentTypeEnum, SimpleSearchConfigModel } from '@tailormap-viewer/api';
import { SimpleSearchComponentConfigComponent } from './simple-search-component-config.component';
import { ComponentConfigurationService } from '../../services/component-configuration.service';

const setup = async (config: SimpleSearchConfigModel = { enabled: true }) => {
  const componentConfigService = { updateConfigForKey: vi.fn(), updateConfig: vi.fn() };
  await render(SimpleSearchComponentConfigComponent, {
    inputs: { type: BaseComponentTypeEnum.SIMPLE_SEARCH, label: 'Search', config },
    providers: [{ provide: ComponentConfigurationService, useValue: componentConfigService }],
  });
  return { updateConfigForKey: componentConfigService.updateConfigForKey };
};

describe('SimpleSearchComponentConfigComponent', () => {

  test('saves the search cadastral parcels toggle, defaults to off', async () => {
    const { updateConfigForKey } = await setup();
    const toggle = screen.getByRole('switch', { name: /Search cadastral parcels/ });
    expect(toggle).not.toBeChecked();
    expect(screen.queryByText('Cadastral municipality filter')).not.toBeInTheDocument();
    await userEvent.click(toggle);
    expect(updateConfigForKey).toHaveBeenCalledWith(BaseComponentTypeEnum.SIMPLE_SEARCH, 'searchCadastralParcels', true);
    expect(await screen.findByText('Cadastral municipality filter')).toBeInTheDocument();
  });

  test('shows the selected kadastrale gemeenten and deletes them', async () => {
    const { updateConfigForKey } = await setup({
      enabled: true,
      searchCadastralParcels: true,
      cadastralMunicipalities: [ 'ATN02', 'ABG00' ],
    });
    expect(screen.getByRole('switch', { name: /Search cadastral parcels/ })).toBeChecked();
    expect(await screen.findByText('Aalten (ATN02)')).toBeInTheDocument();
    expect(await screen.findByText('Aalburg (ABG00)')).toBeInTheDocument();
    const aaltenRow = screen.getByText('Aalten (ATN02)');
    const deleteButton = aaltenRow.nextElementSibling?.querySelector('button');
    expect(deleteButton).toBeTruthy();
    await userEvent.click(deleteButton as HTMLButtonElement);
    expect(updateConfigForKey).toHaveBeenCalledWith(BaseComponentTypeEnum.SIMPLE_SEARCH, 'cadastralMunicipalities', ['ABG00']);
  });

  test('autocomplete matches on name and code, excludes selected entries and adds all codes', async () => {
    const { updateConfigForKey } = await setup({
      enabled: true,
      searchCadastralParcels: true,
      cadastralMunicipalities: ['ABG00'],
    });
    const input = screen.getByRole('combobox', { name: 'Cadastral municipality' });
    await userEvent.type(input, 'atn0');
    expect(await screen.findByRole('option', { name: 'Aalten (ATN02)' })).toBeInTheDocument();
    await userEvent.clear(input);
    await userEvent.type(input, 'aalburg');
    expect(screen.queryByRole('option', { name: 'Aalburg (ABG00)' })).not.toBeInTheDocument();
    await userEvent.clear(input);
    await userEvent.type(input, 'Amsterdam');
    const amsterdam = await screen.findByRole('option', { name: /^Amsterdam \(ASD\d{2} … ASD\d{2}\)$/ });
    await userEvent.click(amsterdam);
    const lastCall = updateConfigForKey.mock.calls[updateConfigForKey.mock.calls.length - 1];
    expect(lastCall[1]).toBe('cadastralMunicipalities');
    expect(lastCall[2][0]).toBe('ABG00');
    expect(lastCall[2].length).toBeGreaterThan(10);
    expect(lastCall[2].every((code: string) => /^(ABG00|ASD\d{2})$/.test(code))).toBe(true);
  });

});
