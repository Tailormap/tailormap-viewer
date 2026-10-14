import { describe, test, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { computed, signal } from '@angular/core';
import { TreeModel } from '@tailormap-viewer/shared';
import { AppLayerModel } from '@tailormap-viewer/api';
import { TocNodeDecorationService } from './toc-node-decoration.service';

const node: TreeModel<AppLayerModel> = { id: '1', label: 'Layer 1', type: 'layer' };

describe('TocNodeDecorationService', () => {

  test('returns empty decoration without decorators', () => {
    const service = TestBed.inject(TocNodeDecorationService);
    expect(service.getDecoration(node)).toEqual({ cssClasses: [], labelCssClasses: [], icons: [] });
  });

  test('merges decorations of all decorators', () => {
    const service = TestBed.inject(TocNodeDecorationService);
    service.registerDecorator('a', () => ({ cssClasses: ['a'], icons: [{ svgIcon: 'info', ariaLabel: 'Info' }] }));
    service.registerDecorator('b', () => ({ cssClasses: ['b'], labelCssClasses: ['italic'] }));
    service.registerDecorator('c', () => null);
    expect(service.getDecoration(node)).toEqual({
      cssClasses: [ 'a', 'b' ],
      labelCssClasses: ['italic'],
      icons: [{ svgIcon: 'info', ariaLabel: 'Info' }],
    });
  });

  test('replaces and deregisters decorators by id', () => {
    const service = TestBed.inject(TocNodeDecorationService);
    service.registerDecorator('a', () => ({ cssClasses: ['first'] }));
    service.registerDecorator('a', () => ({ cssClasses: ['second'] }));
    expect(service.getDecoration(node).cssClasses).toEqual(['second']);
    service.deregisterDecorator('a');
    expect(service.getDecoration(node).cssClasses).toEqual([]);
  });

  test('tracks signals read by decorators', () => {
    const service = TestBed.inject(TocNodeDecorationService);
    const highlighted = signal<string[]>([]);
    service.registerDecorator('a', n => highlighted().includes(n.id) ? { cssClasses: ['highlighted'] } : null);
    const decoration = TestBed.runInInjectionContext(() => computed(() => service.getDecoration(node)));
    expect(decoration().cssClasses).toEqual([]);
    highlighted.set(['1']);
    expect(decoration().cssClasses).toEqual(['highlighted']);
  });

});
