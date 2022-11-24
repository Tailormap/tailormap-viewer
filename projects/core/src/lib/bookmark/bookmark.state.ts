import { SerializedBookmark } from './bookmark.model';

export const bookmarkStateKey = 'bookmark';

export interface BookmarkState {
    primed: boolean;
    appliedBookmarks: number[];
    bookmarkData: SerializedBookmark[];
}

export const initialBookmarkState: BookmarkState = {
    primed: false,
    appliedBookmarks: [],
    bookmarkData: [],
};
