import { Component, ChangeDetectionStrategy, Inject, LOCALE_ID } from '@angular/core';
import { APP_BASE_HREF } from '@angular/common';
import { LanguageDescriptionModel } from './language-description.model';
import { LanguageHelper } from './language.helper';

@Component({
  selector: 'tm-language-toggle',
  templateUrl: './language-toggle.component.html',
  styleUrls: ['./language-toggle.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LanguageToggleComponent {

  public availableLanguages = LanguageHelper.availableLanguages;
  public selectedLanguage: LanguageDescriptionModel | undefined;

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
