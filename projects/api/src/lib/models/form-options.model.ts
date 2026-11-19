import { FormTabModel } from './form-tab.model';

export interface FormOptionsModel {
  /** Comments for administrators. Not sent to the viewer. */
  adminComments?: string;
  tabs: FormTabModel[];
}
