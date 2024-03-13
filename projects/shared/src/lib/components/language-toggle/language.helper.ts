import { LanguageDescriptionModel } from './language-description.model';

export class LanguageHelper {

  public static availableLanguages: LanguageDescriptionModel[] = [
    {
      nativeLabel: 'English',
      localizedLabel: $localize `:@@shared.language.english:English`,
      code: 'en',
      icon: 'languages_gb',
    },
    {
      nativeLabel: 'Deutsch',
      localizedLabel: $localize `:@@shared.language.german:German`,
      code: 'de',
      icon: 'languages_de',
    },
    {
      nativeLabel: 'Nederlands',
      localizedLabel: $localize `:@@shared.language.dutch:Dutch`,
      code: 'nl',
      icon: 'languages_nl',
    },
  ];

}
