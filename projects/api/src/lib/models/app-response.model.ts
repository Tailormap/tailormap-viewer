import { Language } from './language.enum';
import { ComponentModel } from './component.model';
import { AppStylingModel } from './app-styling.model';

export interface AppResponseModel {
    id: number;
    apiVersion: string;
    name: string;
    title: string;
    lang: Language;
    styling?: AppStylingModel;
    components: ComponentModel[];
}
