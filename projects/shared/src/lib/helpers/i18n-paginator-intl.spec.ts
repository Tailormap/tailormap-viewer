import { describe, test, expect, vi } from 'vitest';
import { I18nPaginatorIntl } from './i18n-paginator-intl';

describe('I18nPaginatorIntl', () => {

  test('shows the range with the length', () => {
    const intl = new I18nPaginatorIntl();
    expect(intl.getRangeLabel(0, 100, 0)).toBe('0 of 0');
    expect(intl.getRangeLabel(0, 100, 250)).toBe('1 - 100 of 250');
    expect(intl.getRangeLabel(2, 100, 250)).toBe('201 - 250 of 250');
  });

  test('shows the range with an unknown total', () => {
    const intl = new I18nPaginatorIntl();
    intl.setTotalUnknown(true);
    expect(intl.getRangeLabel(0, 100, 101)).toBe('1 - 100 of unknown');
    expect(intl.getRangeLabel(4, 100, 400)).toBe('0 of unknown');
  });

  test('emits changes only when the unknown total flag changes', () => {
    const intl = new I18nPaginatorIntl();
    const changes = vi.fn();
    intl.changes.subscribe(changes);
    intl.setTotalUnknown(false);
    expect(changes).not.toHaveBeenCalled();
    intl.setTotalUnknown(true);
    intl.setTotalUnknown(true);
    expect(changes).toHaveBeenCalledTimes(1);
    intl.setTotalUnknown(false);
    expect(changes).toHaveBeenCalledTimes(2);
    expect(intl.getRangeLabel(0, 100, 250)).toBe('1 - 100 of 250');
  });

});
