import { BookmarkProtoFragmentDescriptor, BookmarkStringFragmentDescriptor } from '../bookmark/bookmark.models';
import { BookmarkService } from '../bookmark/bookmark.service';
import { LayerTreeOrderBookmarkFragment, LayerVisibilityBookmarkFragment } from './bookmark_pb';

export class ApplicationBookmarkFragments {

  public static LOCATION_BOOKMARK_DESCRIPTOR = new BookmarkStringFragmentDescriptor(
    BookmarkService.LOCATION_IDENTIFIER,
  );

  public static VISIBILITY_BOOKMARK_DESCRIPTOR = new BookmarkProtoFragmentDescriptor(
    '1',
    LayerVisibilityBookmarkFragment,
  );

  public static ORDERING_BOOKMARK_DESCRIPTOR = new BookmarkProtoFragmentDescriptor(
    '2',
    LayerTreeOrderBookmarkFragment,
  );

  public static EMBED_BOOKMARK_DESCRIPTOR = new BookmarkStringFragmentDescriptor(
    'embed',
  );

  public static READABLE_VISIBILITY_BOOKMARK_DESCRIPTOR = new BookmarkStringFragmentDescriptor(
    'layers',
  );

}
