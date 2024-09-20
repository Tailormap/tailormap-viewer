import { ChangeDetectionStrategy, Component, Input, OnChanges, SecurityContext, signal } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { FeatureInfoModel } from '../models/feature-info.model';
import { from, take } from 'rxjs';

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
  ) {}

  public ngOnChanges() {
    from(import('marked'))
      .pipe(take(1))
      .subscribe(markedLib => {
        const replacements: string[] = [];
        const replacementMap = new Map<string, string>();
        this.feature?.sortedAttributes.forEach(a => {
          replacements.push(a.key);
          replacementMap.set(a.key, a.attributeValue);
        });
        const regex = new RegExp('{{\\s*(' + replacements.join('|') + ')\\s*}}', 'gi');
        const replaced = this.template?.replace(regex, (fullMatch, match) => {
          return replacementMap.get(match) || "";
        });
        const html = this.sanitizer.sanitize(SecurityContext.HTML, markedLib.marked.parse(replaced ?? "", { async: false }));
        this.rendererTemplate.set(this.sanitizer.bypassSecurityTrustHtml(html || ""));
      });
  }

}
