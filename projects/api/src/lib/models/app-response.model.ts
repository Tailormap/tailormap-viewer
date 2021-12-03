import { Language } from './language.enum';

export interface AppResponseModel {
    id: number;
    api_version: string;
    name: string;
    title: string;
    lang: Language;
    styling?: object;
}
