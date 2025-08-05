import { Component, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
import { BaseComponentTypeEnum, InfoComponentConfigModel } from "@tailormap-viewer/api";
import { InfoMenuButtonComponent } from "../info-menu-button/info-menu-button.component";
import { ComponentConfigHelper } from "../../../shared/helpers/component-config.helper";
import { Store } from "@ngrx/store";
import { MenubarService } from '../../menubar';
import { MarkdownHelper } from '@tailormap-viewer/shared';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { take } from 'rxjs';

@Component({
  selector: 'tm-info',
  templateUrl: './info.component.html',
  styleUrls: ['./info.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class InfoComponent implements OnInit {

  private openOnStartup = false;
  public template = signal<SafeHtml | null>(null);

  constructor(
    private store$: Store,
    private sanitizer: DomSanitizer,
    private menubarService: MenubarService,
  ) {
    ComponentConfigHelper.useInitialConfigForComponent<InfoComponentConfigModel>(
      store$,
      BaseComponentTypeEnum.INFO,
      config => {
        this.openOnStartup = config.openOnStartup ?? false;
        MarkdownHelper.getSafeHtmlForMarkdown$(config.templateContent ?? '', this.sanitizer)
          .pipe(take(1))
          .subscribe(html => {
            console.log(html);
            this.template.set(html);
          });
      },
    );
  }

  public ngOnInit(): void {
    this.menubarService.registerComponent({ type: BaseComponentTypeEnum.INFO, component: InfoMenuButtonComponent });
    if (this.openOnStartup) {
      this.menubarService.toggleActiveComponent(BaseComponentTypeEnum.INFO, $localize `:@@core.info.info:Info`);
    }
  }

}
