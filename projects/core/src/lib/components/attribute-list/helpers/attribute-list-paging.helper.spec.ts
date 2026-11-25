import { describe, test, expect } from 'vitest';
import { AttributeListPagingHelper } from './attribute-list-paging.helper';

describe('AttributeListPagingHelper', () => {

  test('uses the total from the source when known', () => {
    const paging = AttributeListPagingHelper.getPagingData('1', 250, 1, 100, 100);
    expect(paging).toEqual({ id: '1', totalCount: 250, pageIndex: 1, pageSize: 100, knownTotalCount: 250, paginatorLength: 250, pageLoaded: true });
  });

  test('uses a total of 0 from the source', () => {
    const paging = AttributeListPagingHelper.getPagingData('1', 0, 1, 100, 0);
    expect(paging.knownTotalCount).toBe(0);
    expect(paging.paginatorLength).toBe(0);
  });

  test.each([ null, -1 ])('allows the next page when total is %s and the page is full', total => {
    const paging = AttributeListPagingHelper.getPagingData('1', total, 1, 100, 100);
    expect(paging.knownTotalCount).toBeNull();
    expect(paging.paginatorLength).toBe(101);
  });

  test('allows the next page on a later full page when total is unknown', () => {
    const paging = AttributeListPagingHelper.getPagingData('1', -1, 3, 100, 100);
    expect(paging.knownTotalCount).toBeNull();
    expect(paging.paginatorLength).toBe(301);
  });

  test('derives the total from a page that is not full when total is unknown', () => {
    const paging = AttributeListPagingHelper.getPagingData('1', -1, 3, 100, 42);
    expect(paging.knownTotalCount).toBe(242);
    expect(paging.paginatorLength).toBe(242);
  });

  test('derives a total of 0 from an empty first page', () => {
    const paging = AttributeListPagingHelper.getPagingData('1', -1, 1, 100, 0);
    expect(paging.knownTotalCount).toBe(0);
    expect(paging.paginatorLength).toBe(0);
  });

  test('keeps the total unknown for an empty page after the first page', () => {
    const paging = AttributeListPagingHelper.getPagingData('1', -1, 5, 100, 0);
    expect(paging.knownTotalCount).toBeNull();
    expect(paging.paginatorLength).toBe(400);
  });

  test('uses the row count when there is no page size', () => {
    const paging = AttributeListPagingHelper.getPagingData('1', null, 1, 0, 0);
    expect(paging.knownTotalCount).toBe(0);
    expect(paging.paginatorLength).toBe(0);
  });

});
