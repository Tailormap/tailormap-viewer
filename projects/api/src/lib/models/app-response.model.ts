import { Language } from './language.enum';
import { ComponentModel } from './component.model';

export interface AppResponseModel {
    id: number;
    apiVersion: string;
    name: string;
    title: string;
    lang: Language;
    styling?: object;
    components: ComponentModel[];
}
