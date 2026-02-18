import { BookmarkJsonFragmentDescriptor, BookmarkStringFragmentDescriptor } from '../bookmark/bookmark.models';
import { BookmarkService } from '../bookmark/bookmark.service';

export class ApplicationBookmarkFragments {

  public static LOCATION_BOOKMARK_DESCRIPTOR = new BookmarkStringFragmentDescriptor(
    BookmarkService.LOCATION_IDENTIFIER,
  );

  public static VISIBILITY_BOOKMARK_DESCRIPTOR = new BookmarkJsonFragmentDescriptor<LayerVisibilityBookmarkFragment>(
    'l',
  );

  public static ORDERING_BOOKMARK_DESCRIPTOR = new BookmarkJsonFragmentDescriptor<LayerTreeOrderBookmarkFragment>(
    'toc',
  );

  public static EMBED_BOOKMARK_DESCRIPTOR = new BookmarkStringFragmentDescriptor(
    'embed',
  );

  public static READABLE_VISIBILITY_BOOKMARK_DESCRIPTOR = new BookmarkStringFragmentDescriptor(
    'layers',
  );
}

export type LayerVisibilityBookmarkFragment = Array<BookmarkLayerInfo>;

// Compact JSON format for encoding in bookmark fragment, so no long identifiers
export interface BookmarkLayerInfo {
  id: string; // app layer id
  v?: number; // visibility: undefined = as configured, 1 = visible, 0 = invisible
  o?: number; // opacity: undefined = as configured, otherwise opacity
}

export type LayerTreeOrderBookmarkFragment = Array<BookmarkNodeChildrenOrder>;

export interface BookmarkNodeChildrenOrder {
  id: string; // app layer id
  c: string[]; // children ids in (changed) order
}
