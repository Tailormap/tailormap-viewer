import { Language } from './language.enum';
import { ComponentModel } from './component.model';
import { ViewerStylingModel } from './viewer-styling.model';

export interface ViewerResponseModel {

  kind: string;
  name: string;
  title: string;
  baseViewers: string[];
  languages: Language[];
  projections: string[]
  styling?: ViewerStylingModel;
  components: ComponentModel[];
}
