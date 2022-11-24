import * as BookmarkActions from './bookmark.actions';
import { Action, createReducer, on } from '@ngrx/store';
import { BookmarkState, initialBookmarkState } from './bookmark.state';
import { BookmarkHelper } from './bookmark.helper';
import { SerializedBookmark } from './bookmark.model';

const bookmarkEquals = (a: SerializedBookmark, b: SerializedBookmark) => {
  if (a.id !== b.id || a.value.length !== b.value.length) {
    return false;
  }

  for (let i = 0; i < a.value.length; i++) {
    if (a.value[i] !== b.value[i]) {
      return false;
    }
  }

  return true;
};

const onLoadFragment = (
  state: BookmarkState,
  payload: ReturnType<typeof BookmarkActions.loadFragment>,
): BookmarkState => {
  if (payload.fragment === undefined || payload.fragment === null) { // TODO(puck): fragment can be null somehow
    return { ...initialBookmarkState, primed: true };
  }

  const decomposed = BookmarkHelper.decomposeBookmarks(payload.fragment);
  return { primed: true, bookmarkData: decomposed, appliedBookmarks: [] };
};

const onSetBookmarkData = (
  state: BookmarkState,
  payload: ReturnType<typeof BookmarkActions.setBookmarkData>,
): BookmarkState => {
  if (!state.primed) {
    return state;
  }

  const previousBookmark = state.bookmarkData.find(a => a.id === payload.data.id);
  if (previousBookmark && bookmarkEquals(previousBookmark, payload.data)) {
    return state;
  }

  return {
    ...state,
    bookmarkData: [ ...state.bookmarkData.filter(a => a.id !== payload.data.id), payload.data ],
    appliedBookmarks: state.appliedBookmarks.filter(a => a !== payload.data.id),
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

  const appliedCorrectBookmark = state.bookmarkData.find(a => bookmarkEquals(a, bookmark));
  if (appliedCorrectBookmark) {
    return {
      ...state,
      appliedBookmarks: [ ...state.appliedBookmarks.filter(a => a !== bookmark.id), bookmark.id ],
    };
  } else {
    return state;
  }
};

const bookmarkReducerImpl = createReducer<BookmarkState>(
  initialBookmarkState,
  on(BookmarkActions.loadFragment, onLoadFragment),
  on(BookmarkActions.setBookmarkData, onSetBookmarkData),
  on(BookmarkActions.appliedBookmarkData, onAppliedBookmarkData),
);
export const bookmarkReducer = (state: BookmarkState | undefined, action: Action) => bookmarkReducerImpl(state, action);
