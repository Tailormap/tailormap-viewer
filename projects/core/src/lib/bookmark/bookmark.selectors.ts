import { createFeatureSelector, createSelector } from '@ngrx/store';
import { BookmarkState, bookmarkStateKey } from './bookmark.state';
import { BookmarkHelper } from './bookmark.helper';

const selectBookmarkState = createFeatureSelector<BookmarkState>(bookmarkStateKey);

export const selectUnappliedFragment = (id: number) => createSelector(selectBookmarkState, state => state.appliedBookmarks.indexOf(id) === -1 ? state.bookmarkData.find(a => a.id === id) : undefined);
export const selectHasUnappliedFragment = (id: number) => createSelector(selectUnappliedFragment(id), state => state !== undefined);

// Returns the bookmark data that must be written to the fragment.
// If any bookmark data is still pending being applied, no bookmark will be returned.
export const selectBookmarkFragment = createSelector(selectBookmarkState, state => {
    if (state.primed && state.appliedBookmarks.length === state.bookmarkData.length) {
        return BookmarkHelper.composeBookmarks(state.bookmarkData);
    }

    return undefined;
});
