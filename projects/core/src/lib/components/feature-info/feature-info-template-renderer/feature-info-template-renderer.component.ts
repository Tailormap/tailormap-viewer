import { ChangeDetectionStrategy, Component, Input, OnChanges, signal } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { FeatureInfoModel } from '../models/feature-info.model';
import { MarkdownHelper } from '@tailormap-viewer/shared';
import { take } from 'rxjs';

@Component({
  selector: 'tm-feature-info-template-renderer',
  templateUrl: './feature-info-template-renderer.component.html',
  styleUrls: ['./feature-info-template-renderer.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
})
export class FeatureInfoTemplateRendererComponent implements OnChanges {

  @Input()
  public feature: FeatureInfoModel | undefined;

  @Input()
  public template: string | undefined;

  public rendererTemplate = signal<SafeHtml | null>(null);

  constructor(
    private sanitizer: DomSanitizer,
  ) {
  }

  public ngOnChanges() {
    if (!this.template) {
      this.rendererTemplate.set(null);
      return;
    }
    const replacements: string[] = [];
    const replacementMap = new Map<string, string>();
    this.feature?.sortedAttributes.forEach(a => {
      replacements.push(FeatureInfoTemplateRendererComponent.escapeRegExp(a.key));
      replacementMap.set(a.key, a.attributeValue);
    });
    const regex = new RegExp('{{\\s*(' + replacements.join('|') + ')\\s*}}', 'gi');
    const replaced = this.template?.replace(regex, (fullMatch, match) => {
      return replacementMap.get(match) || "";
    });
    MarkdownHelper.getSafeHtmlForMarkdown$(replaced ?? '', this.sanitizer)
      .pipe(take(1))
      .subscribe(html => this.rendererTemplate.set(html));
  }

  private static escapeRegExp(str: string) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

}
