import { BookmarkFragmentString } from './bookmark.model';

export const bookmarkStateKey = 'bookmark';

export interface BookmarkState {
    primed: boolean;
    appliedBookmarks: number[];
    fragmentContents: BookmarkFragmentString[];
}

export const initialBookmarkState: BookmarkState = {
    primed: false,
    appliedBookmarks: [],
    fragmentContents: [],
};
