import * as BookmarkActions from './bookmark.actions';
import { Action, createReducer, on } from '@ngrx/store';
import { BookmarkState, initialBookmarkState } from './bookmark.state';
import { BookmarkHelper } from './bookmark.helper';

const onLoadFragment = (
  _: BookmarkState,
  payload: ReturnType<typeof BookmarkActions.loadFragment>,
): BookmarkState => {
  if (payload.fragment === undefined || payload.fragment === null) { // TODO(puck): fragment can be null somehow
    return { ...initialBookmarkState, primed: true };
  }

  const decomposed = BookmarkHelper.splitBookmarks(payload.fragment);
  return { primed: true, fragmentContents: decomposed, appliedBookmarks: [] };
};

const onSetBookmarkData = (
  state: BookmarkState,
  payload: ReturnType<typeof BookmarkActions.setBookmarkData>,
): BookmarkState => {
  if (!state.primed) {
    return state;
  }

  const fragment = BookmarkHelper.serializeBookmarkData(payload.data);
  const previousBookmark = state.fragmentContents.find(a => a.id === payload.data.id);

  if (previousBookmark && previousBookmark.data === fragment) {
    return state;
  }

  if (fragment === '') {
    return {
      ...state,
      fragmentContents: [...state.fragmentContents.filter(a => a.id !== payload.data.id)],
      appliedBookmarks: state.appliedBookmarks.filter(a => a !== payload.data.id),
    };
  }

  return {
    ...state,
    fragmentContents: [ ...state.fragmentContents.filter(a => a.id !== payload.data.id), { id: payload.data.id, data: fragment }],
    appliedBookmarks: state.appliedBookmarks.filter(a => a !== payload.data.id),
  };
};

const onUnsetBookmarkData = (
  state: BookmarkState,
  payload: ReturnType<typeof BookmarkActions.unsetBookmarkData>,
): BookmarkState => {
  if (!state.primed) {
    return state;
  }

  return {
    ...state,
    fragmentContents: [ ...state.fragmentContents.filter(a => a.id !== payload.id)],
    appliedBookmarks: state.appliedBookmarks.filter(a => a !== payload.id),
  };
};

const onAppliedBookmarkData = (
  state: BookmarkState,
  payload: ReturnType<typeof BookmarkActions.appliedBookmarkData>,
): BookmarkState => {
  if (payload.bookmark === undefined) {
    return state;
  }

  const bookmark = payload.bookmark;
  if (bookmark === undefined) {
      return state;
  }

  const fragment = BookmarkHelper.serializeBookmarkData(payload.bookmark);
  const currentBookmark = state.fragmentContents.find(a => a.id === bookmark.id);
  if (currentBookmark === undefined) {
    return state;
  }

  if (currentBookmark.data !== fragment) {
      // Reserialize the old data; it might represent the same data.
      const deserialized = BookmarkHelper.deserializeBookmarkFragment(currentBookmark.id, currentBookmark.data, bookmark.value as any);
      if (deserialized === undefined) {
          return state;
      }

      const reserialized = BookmarkHelper.serializeBookmarkData({ id: currentBookmark.id, value: deserialized });
      if (reserialized !== fragment) {
          return state;
      }

      // If so, update the fragment (so the URI updates)
      return {
        ...state,
        appliedBookmarks: [ ...state.appliedBookmarks.filter(a => a !== bookmark.id), bookmark.id ],
        fragmentContents: [ ...state.fragmentContents.filter(a => a.id !== bookmark.id), { id: bookmark.id, data: reserialized }],
      };
  }

  return {
    ...state,
    appliedBookmarks: [ ...state.appliedBookmarks.filter(a => a !== bookmark.id), bookmark.id ],
  };
};

const bookmarkReducerImpl = createReducer<BookmarkState>(
  initialBookmarkState,
  on(BookmarkActions.loadFragment, onLoadFragment),
  on(BookmarkActions.setBookmarkData, onSetBookmarkData),
  on(BookmarkActions.unsetBookmarkData, onUnsetBookmarkData),
  on(BookmarkActions.appliedBookmarkData, onAppliedBookmarkData),
);
export const bookmarkReducer = (state: BookmarkState | undefined, action: Action) => bookmarkReducerImpl(state, action);
