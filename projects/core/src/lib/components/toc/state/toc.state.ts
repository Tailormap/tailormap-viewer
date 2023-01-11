export const tocStateKey = 'toc';

export interface TocState {
  filterEnabled: boolean;
  filterTerm: string | null;
  infoTreeNodeId: string | null;
}

export const initialTocState: TocState = {
  filterEnabled: false,
  filterTerm: null,
  infoTreeNodeId: null,
};
