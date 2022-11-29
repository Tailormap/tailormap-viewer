import { createAction, props } from '@ngrx/store';
import { BookmarkFragment } from './bookmark.model';

const prefix = '[Bookmark]';

export const loadFragment = createAction(
  `${prefix} Load Fragment`,
  props<{ fragment?: string }>(),
);
export const setBookmarkData = createAction(
  `${prefix} Set Bookmark Data`,
  props<{ data: BookmarkFragment }>(),
);
export const appliedBookmarkData = createAction(
  `${prefix} Applied Bookmark Data`,
  props<{ bookmark?: BookmarkFragment }>(),
);
