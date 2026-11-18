import { describe, expect, test } from 'vitest';
import { CadastralMunicipalityHelper } from './cadastral-municipality.helper';

describe('CadastralMunicipalityHelper', () => {

  test('returns the list of current kadastrale gemeenten', () => {
    const list = CadastralMunicipalityHelper.getCadastralMunicipalities();
    expect(list.flatMap(m => m.codes).length).toBeGreaterThan(1000);
    expect(list.find(m => m.name === 'Aalten')).toEqual({ name: 'Aalten', codes: ['ATN02'] });
  });

  test('has unique names and unique, valid AKR codes', () => {
    const list = CadastralMunicipalityHelper.getCadastralMunicipalities();
    expect(new Set(list.map(m => m.name)).size).toBe(list.length);
    list.forEach(m => expect(m.codes.length).toBeGreaterThan(0));
    const codes = list.flatMap(m => m.codes);
    expect(new Set(codes).size).toBe(codes.length);
    codes.forEach(code => expect(code).toMatch(/^[A-Z]{3}\d{2}$/));
  });

  test('contains kadastrale gemeenten with multiple AKR codes', () => {
    const amsterdam = CadastralMunicipalityHelper.getCadastralMunicipalities().find(m => m.name === 'Amsterdam');
    expect(amsterdam?.codes).toContain('ASD02');
    expect(amsterdam?.codes).toContain('ASD43');
  });

  test('does not contain expired kadastrale gemeenten', () => {
    const names = CadastralMunicipalityHelper.getCadastralMunicipalities().map(m => m.name);
    expect(names).not.toContain('Beltrum');
    expect(names).not.toContain('Abbekerk');
  });

});
