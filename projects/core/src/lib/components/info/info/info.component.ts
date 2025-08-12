import { Component, OnInit, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { BaseComponentTypeEnum, InfoComponentConfigModel } from "@tailormap-viewer/api";
import { InfoMenuButtonComponent } from "../info-menu-button/info-menu-button.component";
import { ComponentConfigHelper } from "../../../shared/helpers/component-config.helper";
import { Store } from "@ngrx/store";
import { MenubarService } from '../../menubar';
import { MarkdownHelper } from '@tailormap-viewer/shared';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Observable, take } from 'rxjs';

@Component({
  selector: 'tm-info',
  templateUrl: './info.component.html',
  styleUrls: ['./info.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class InfoComponent implements OnInit {

  private store$ = inject(Store);
  private menubarService = inject(MenubarService);
  private sanitizer = inject(DomSanitizer);

  public visible$: Observable<boolean>;

  private openOnStartup = false;
  private dialogTitle = $localize `:@@core.info.info:Info`;
  public template = signal<SafeHtml | null>(null);

  constructor() {
    this.visible$ = this.menubarService.isComponentVisible$(BaseComponentTypeEnum.INFO);

    ComponentConfigHelper.useInitialConfigForComponent<InfoComponentConfigModel>(
      this.store$,
      BaseComponentTypeEnum.INFO,
      config => {
        this.openOnStartup = config.openOnStartup ?? false;
        this.dialogTitle = config.title ?? this.dialogTitle;
        MarkdownHelper.getSafeHtmlForMarkdown$(config.templateContent ?? '', this.sanitizer)
          .pipe(take(1))
          .subscribe(html => {
            this.template.set(html);
          });
      },
    );
  }

  public ngOnInit(): void {
    this.menubarService.registerComponent({ type: BaseComponentTypeEnum.INFO, component: InfoMenuButtonComponent });
    if (this.openOnStartup) {
      this.menubarService.toggleActiveComponent(BaseComponentTypeEnum.INFO, this.dialogTitle);
    }
  }

}
