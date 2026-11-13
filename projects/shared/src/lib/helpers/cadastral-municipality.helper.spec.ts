import { describe, expect, test } from 'vitest';
import { CadastralMunicipalityHelper } from './cadastral-municipality.helper';

describe('CadastralMunicipalityHelper', () => {

  test('returns the list of current kadastrale gemeenten', () => {
    const list = CadastralMunicipalityHelper.getCadastralMunicipalities();
    expect(list.length).toBeGreaterThan(1000);
    expect(list.find(m => m.name === 'Aalten')).toEqual({ code: '5', name: 'Aalten', akrCodes: ['ATN02'] });
  });

  test('has unique codes and valid AKR codes', () => {
    const list = CadastralMunicipalityHelper.getCadastralMunicipalities();
    expect(new Set(list.map(m => m.code)).size).toBe(list.length);
    const akrCodes = list.flatMap(m => m.akrCodes);
    expect(new Set(akrCodes).size).toBe(akrCodes.length);
    akrCodes.forEach(akrCode => expect(akrCode).toMatch(/^[A-Z]{3}\d{2}$/));
  });

  test('contains kadastrale gemeenten with multiple AKR codes', () => {
    const amsterdam = CadastralMunicipalityHelper.getCadastralMunicipalities().find(m => m.name === 'Amsterdam');
    expect(amsterdam?.akrCodes).toContain('ASD02');
    expect(amsterdam?.akrCodes).toContain('ASD43');
  });

  test('does not contain expired kadastrale gemeenten', () => {
    const names = CadastralMunicipalityHelper.getCadastralMunicipalities().map(m => m.name);
    expect(names).not.toContain('Beltrum');
    expect(names).not.toContain('Abbekerk');
  });

  test('isCadastralMunicipalityModel', () => {
    expect(CadastralMunicipalityHelper.isCadastralMunicipalityModel({ code: '5', name: 'Aalten', akrCodes: ['ATN02'] })).toBe(true);
    expect(CadastralMunicipalityHelper.isCadastralMunicipalityModel('Aalten')).toBe(false);
    expect(CadastralMunicipalityHelper.isCadastralMunicipalityModel(null)).toBe(false);
    expect(CadastralMunicipalityHelper.isCadastralMunicipalityModel({ municipalityCode: '0197' })).toBe(false);
  });

});
