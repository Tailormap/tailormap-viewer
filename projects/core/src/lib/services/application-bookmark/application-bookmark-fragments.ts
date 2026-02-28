import { BookmarkJsonFragmentDescriptor, BookmarkStringFragmentDescriptor } from '../bookmark/bookmark.models';
import { BookmarkService } from '../bookmark/bookmark.service';
import {
  AttributeFilterModel,
  AttributeType, FilterConditionEnum, FilterGroupModel, SpatialFilterModel,
} from '@tailormap-viewer/api';

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

  public static FILTER_BOOKMARK_DESCRIPTOR = new BookmarkJsonFragmentDescriptor<FilterBookmarkFragment>(
    'f',
  );

  public static EMBED_BOOKMARK_DESCRIPTOR = new BookmarkStringFragmentDescriptor(
    'embed',
  );

  public static READABLE_VISIBILITY_BOOKMARK_DESCRIPTOR = new BookmarkStringFragmentDescriptor(
    'layers',
  );

  public static MOBILE_LAYOUT_BOOKMARK_DESCRIPTOR = new BookmarkStringFragmentDescriptor(
    'mobile',
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

// export type CompactFilterBookmarkFragment = {
//   al?: Array<BookmarkFilterGroup<BookmarkAttributeFilterModel>>; // attribute layer filters
//   s?: Array<BookmarkFilterGroup<BookmarkSpatialFilterModel>>; // spatial filters
// };

export type FilterBookmarkFragment = {
  al?: Array<FilterGroupModel<AttributeFilterModel>>; // attribute layer filters
  s?: Array<FilterGroupModel<SpatialFilterModel>>; // spatial filters
};

export type BookmarkFilterGroup<T> = {
  id: string;
  l: string[]; // layerIds
  d?: boolean; // disabled
  f: Array<T>;
};

export type BookmarkAttributeFilterModel = {
  id: string;
  d?: boolean; // disabled
  a: string; // attribute
  aT: AttributeType; // attributeType (could be numeric enum)
  c: FilterConditionEnum; // condition (could be 1 char or numeric enum)
  iC: boolean; // invertCondition
  cS: boolean; // caseSensitive
  v: string[]; // value
  aA?: string; // attributeAlias
};

export type BookmarkSpatialFilterModel = {
  id: string;
  d?: boolean; // disabled
  gC /* geometryColums */ : Array<{ l /* layerId */: string; c /* column*/: string[] }>;
  g /* geometries */: Array<{ id: string; g /* geometry */: string; l? /* referenceLayerId*/: string }>;
  l?: string; // baseLayerId
  b?: number; // buffer
};
