import { Component, OnInit, TemplateRef, inject, ChangeDetectionStrategy } from '@angular/core';
import { OverlayRef } from '../overlay-ref';
import { OverlayContent } from '../overlay-content';
import { NgTemplateOutlet } from '@angular/common';

@Component({
    selector: 'tm-overlay',
    templateUrl: './overlay.component.html',
    // eslint-disable-next-line @angular-eslint/prefer-on-push-component-change-detection
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [NgTemplateOutlet],
})
export class OverlayComponent implements OnInit {
  private ref = inject(OverlayRef);
  public content = inject(OverlayContent);

  public contentType: 'template' | null = null;
  public context: { $implicit: any; close: () => void } | null = null;

  public close() {
    this.ref.close(null);
  }

  public ngOnInit() {
    if (this.content.content instanceof TemplateRef) {
      this.contentType = 'template';
      this.context = {
        $implicit: this.ref.data,
        close: this.ref.close.bind(this.ref),
      };
    }
  }

  public getTemplateContent() {
    if (this.content.content instanceof TemplateRef) {
      return this.content.content;
    }
    return null;
  }

}
