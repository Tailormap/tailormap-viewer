import { BehaviorSubject, Subject } from 'rxjs';
import { Injectable } from '@angular/core';

export interface MarkdownEditorInsertedText {
  text: string;
  /**
   * When true the text is Markdown which should be parsed by the visual editor (for example a link or image).
   * When false the text is inserted literally (for example a `{{variable}}`).
   * The source editor inserts both as raw text.
   */
  markdown: boolean;
}

@Injectable()
export class MarkdownEditorService {

  private content = new BehaviorSubject('');
  private updatedContent = new BehaviorSubject('');

  private insertedText = new Subject<MarkdownEditorInsertedText>();

  public insertVariable(value: string) {
    this.insertText(`{{${value}}}`);
  }

  public insertText(text: string, options?: { markdown?: boolean }) {
    this.insertedText.next({ text, markdown: options?.markdown ?? false });
  }

  public resetContent(content: string) {
    if (this.content.value !== content) {
      this.content.next(content);
    }
    if (this.updatedContent.value !== content) {
      this.updatedContent.next(content);
    }
  }

  public contentChanged(content: string) {
    this.updatedContent.next(content);
  }

  public getCurrentContent() {
    return this.updatedContent.value;
  }

  public getContent$() {
    return this.content.asObservable();
  }

  public getUpdatedContent$() {
    return this.updatedContent.asObservable();
  }

  public getInsertedText$() {
    return this.insertedText.asObservable();
  }

}
