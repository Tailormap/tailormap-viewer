import { Component, ChangeDetectionStrategy, Inject, LOCALE_ID } from '@angular/core';
import { APP_BASE_HREF } from '@angular/common';

interface LanguageToggleLang {
  label: string;
  code: string;
  icon: string;
}

@Component({
  selector: 'tm-language-toggle',
  templateUrl: './language-toggle.component.html',
  styleUrls: ['./language-toggle.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LanguageToggleComponent {

  public availableLanguages: LanguageToggleLang[] = [
    { label: 'English', code: 'en', icon: 'languages_gb' },
    { label: 'Nederlands', code: 'nl', icon: 'languages_nl' },
  ];

  public selectedLanguage: LanguageToggleLang | undefined;

  public canChangeLanguage = false;

  constructor(
    @Inject(APP_BASE_HREF) private baseHref: string,
    @Inject(LOCALE_ID) locale: string,
  ) {
    this.selectedLanguage = this.availableLanguages.find(l => l.code === locale);
    if (this.selectedLanguage) {
      this.canChangeLanguage = this.baseHref.indexOf(`/${this.selectedLanguage.code}`) !== -1;
    }
  }

  public selectLanguage(language: string) {
    const updatedBaseHref = this.baseHref.replace(`/${this.selectedLanguage?.code ||''}`, `/${language}`);
    window.location.href = window.location.href.replace(this.baseHref, updatedBaseHref);
  }

}
