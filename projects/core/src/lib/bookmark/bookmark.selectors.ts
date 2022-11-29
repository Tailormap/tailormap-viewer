import { createFeatureSelector, createSelector, MemoizedSelector } from '@ngrx/store';
import { BookmarkState, bookmarkStateKey } from './bookmark.state';
import { BookmarkHelper } from './bookmark.helper';
import {
  BinaryFragmentType, BinaryFragmentData,
  PositionAndZoomFragmentType, PositionAndZoomFragmentData,
  LayerAndFlagsFragmentType, LayerAndFlagsFragmentData,
  PositionFragmentType, PositionFragmentData,
  BookmarkFragmentType,
} from './bookmark.model';

const selectBookmarkState = createFeatureSelector<BookmarkState>(bookmarkStateKey);

const selectSingleUnappliedFragment = (id: number) => createSelector(selectBookmarkState, state =>
  state.appliedBookmarks.indexOf(id) === -1 ? state.fragmentContents.find(a => a.id === id) : undefined,
);

type UnappliedFragmentMethod = {
  <State>(id: number, type: BinaryFragmentType): MemoizedSelector<State, BinaryFragmentData | undefined>;
  <State>(id: number, type: PositionAndZoomFragmentType): MemoizedSelector<State, PositionAndZoomFragmentData | undefined>;
  <State>(id: number, type: PositionFragmentType): MemoizedSelector<State, PositionFragmentData | undefined>;
  <State, T extends { [Property in keyof T]: boolean }>(id: number, type: LayerAndFlagsFragmentType<T>): MemoizedSelector<State, LayerAndFlagsFragmentData<T> | undefined>;
};

export const selectUnappliedFragment: UnappliedFragmentMethod = (id: number, typ: BookmarkFragmentType) => createSelector(selectBookmarkState, state => {
  if (state.appliedBookmarks.indexOf(id) !== -1) {
    return undefined;
  }

  const fragment = state.fragmentContents.find(a => a.id === id);
  if (fragment === undefined) {
    return undefined;
  }

  const decoded = BookmarkHelper.deserializeBookmarkFragment(id, fragment.data, typ as any);
  return decoded as any;
});

export const selectHasUnappliedFragment = (id: number) => createSelector(selectSingleUnappliedFragment(id), state => state !== undefined);

// Returns the bookmark data that must be written to the fragment.
// If any bookmark data is still pending being applied, no bookmark will be returned.
export const selectBookmarkFragment = createSelector(selectBookmarkState, state => {
  if (state.primed && state.appliedBookmarks.length === state.fragmentContents.length) {
    return BookmarkHelper.composeBookmarks(state.fragmentContents);
  }

  return undefined;
});
