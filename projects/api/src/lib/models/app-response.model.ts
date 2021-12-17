import { Language } from './language.enum';

export interface AppResponseModel {
    id: number;
    apiVersion: string;
    name: string;
    title: string;
    lang: Language;
    styling?: object;
}
