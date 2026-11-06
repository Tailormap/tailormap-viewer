import { BehaviorSubject, Subject } from 'rxjs';
import { Injectable } from '@angular/core';

@Injectable()
export class MarkdownEditorService {

  private content = new BehaviorSubject('');
  private updatedContent = new BehaviorSubject('');

  private insertedVariables = new Subject<string>();

  public insertVariable(value: string) {
    this.insertedVariables.next(value);
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

  public getInsertedVariables$() {
    return this.insertedVariables.asObservable();
  }

}
