export const editStateKey = 'edit';

export interface EditState {
  isActive: boolean;
  selectedLayer: string | null;
}

export const initialEditState: EditState = {
  isActive: false,
  selectedLayer: null,
};
