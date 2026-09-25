import { describe, beforeEach, it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { DomSanitizer } from '@angular/platform-browser';
import { MarkdownToHtmlPipe } from './markdown-to-html.pipe';
import { firstValueFrom } from 'rxjs';

const sanitizerMock: any = {
  sanitize: (context: any, value: string | null) => value,
  bypassSecurityTrustHtml: (str: string | null) => str,
};

describe('MarkdownToHtmlPipe', () => {
  let pipe: MarkdownToHtmlPipe;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: DomSanitizer, useValue: sanitizerMock },
        MarkdownToHtmlPipe,
      ],
    });
    pipe = TestBed.inject(MarkdownToHtmlPipe);
  });

  const markdownToHtml = (str: string) => {
    return firstValueFrom(pipe.transform(str));
  };

  it('renders markdown as HTML', async () => {
    const result = await markdownToHtml('Some *bold* text and some **italic** in there');
    expect(result).toContain('Some <em>bold</em> text and some <strong>italic</strong> in there');
  });

  it('renders markdown with links as HTML', async () => {
    const result = await markdownToHtml('Some [link](https://www.tailormap.nl) in there');
    expect(result).toContain('Some <a href="https://www.tailormap.nl">link</a> in there');
  });

});
