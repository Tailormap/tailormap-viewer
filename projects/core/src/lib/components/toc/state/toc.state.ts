export const tocStateKey = 'toc';

export interface TocState {
  filterEnabled: boolean;
  filterTerm?: string;
  infoTreeNodeId?: string;
}

export const initialTocState: TocState = {
  filterEnabled: false,
};
