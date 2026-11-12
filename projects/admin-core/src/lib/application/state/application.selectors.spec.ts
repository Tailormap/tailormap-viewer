import { describe, it, expect } from 'vitest';
import { getApplication } from '@tailormap-admin/admin-api';
import { selectApplicationList } from './application.selectors';

describe('ApplicationSelectors', () => {

  it('excludes stories from the application list', () => {
    const app = getApplication({ id: '1', name: 'app' });
    const story = getApplication({ id: '2', name: 'story', applicationType: 'stories' });
    expect(selectApplicationList.projector([ app, story ], '')).toEqual([app]);
    expect(selectApplicationList.projector([ app, story ], 'story')).toEqual([]);
  });

});
