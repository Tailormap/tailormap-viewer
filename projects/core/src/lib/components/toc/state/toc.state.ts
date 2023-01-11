export const tocStateKey = 'toc';

export interface TocState {
  filterTerm: string | null;
  infoTreeNodeId: string | null;
}

export const initialTocState: TocState = {
  filterTerm: null,
  infoTreeNodeId: null,
};
