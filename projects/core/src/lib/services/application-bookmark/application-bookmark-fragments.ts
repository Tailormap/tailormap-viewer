import { BookmarkJsonFragmentDescriptor, BookmarkStringFragmentDescriptor } from '../bookmark/bookmark.models';
import { BookmarkService } from '../bookmark/bookmark.service';
import {
  AttributeType, FilterConditionEnum,
} from '@tailormap-viewer/api';

export class ApplicationBookmarkFragments {

  public static LOCATION_BOOKMARK_DESCRIPTOR = new BookmarkStringFragmentDescriptor(
    BookmarkService.LOCATION_IDENTIFIER,
  );

  public static LAYER_SETTINGS_BOOKMARK_DESCRIPTOR = new BookmarkJsonFragmentDescriptor(
    'l',
  );

  public static ORDERING_BOOKMARK_DESCRIPTOR = new BookmarkJsonFragmentDescriptor(
    'toc',
  );

  public static FILTER_BOOKMARK_DESCRIPTOR = new BookmarkJsonFragmentDescriptor(
    'f',
  );

  /* 'sort' is separated from the layer bookmark because it supports different data sources (tabSourceId) */
  public static SORT_BOOKMARK_DESCRIPTOR = new BookmarkJsonFragmentDescriptor(
    'sort',
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

export type LayerSettingsBookmarkFragment = Array<BookmarkLayerSettings>;

// Compact JSON format for encoding in bookmark fragment, so no long identifiers
export interface BookmarkLayerSettings {
  id: string; // app layer id
  v?: number; // visibility: undefined = as configured, 1 = visible, 0 = invisible
  o?: number; // opacity: undefined = as configured, otherwise opacity
  s?: string | null; // style name
}

export type LayerTreeOrderBookmarkFragment = Array<BookmarkNodeChildrenOrder>;

export interface BookmarkNodeChildrenOrder {
  id: string; // app layer id
  c: string[]; // children ids in (changed) order
}

export type CompactFilterBookmarkFragment = {
  a?: BookmarkFilterGroup<BookmarkAttributeFilterModel>[]; // attribute layer filters
  s?: BookmarkFilterGroup<BookmarkSpatialFilterModel>[]; // spatial filters
  p?: BookmarkFilterGroup<BookmarkPresetFilterModel>[]; // preset filters
};

export type BookmarkFilterGroup<T> = {
  id: string;
  l?: string[]; // layerIds
  d?: boolean; // disabled
  pG?: string; // parentGroup
  f: Array<T>;
};

export type BookmarkAttributeFilterModel = {
  id: string;
  d?: boolean; // disabled
  a: string; // attribute
  aT: AttributeType; // attributeType (could be numeric enum)
  c: FilterConditionEnum; // condition (could be 1 char or numeric enum)
  iC?: boolean; // invertCondition
  cS?: boolean; // caseSensitive
  v: string[]; // value
  aA?: string; // attributeAlias
  fT?: string;
};

export type BookmarkSpatialFilterModel = {
  id: string;
  d?: boolean; // disabled
  gC /* geometryColums */ : Array<{ l /* layerId */: string; c /* column*/: string[] }>;
  g /* geometries */: Array<{ id: string; g /* geometry */: string; l? /* referenceLayerId*/: string }>;
  l?: string; // baseLayerId
  b?: number; // buffer
};

export type BookmarkPresetFilterModel = {
  id: string;
  c?: FilterConditionEnum; // condition (changed by SwitchFilterComponent)
  d?: boolean; // disabled
  v?: string[]; // value
};

export type LayerSortBookmarkFragment = Array<BookmarkSortModel>;

/* Only supports sorting on a single column per layer */
export type BookmarkSortModel = {
  s?: string; /* tabSourceId or default */
  l: string; /* layer */
  c: string; /* column */
  d?: boolean; /* descending instead ascending? */
};
