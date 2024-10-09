import { BehaviorSubject, Subject } from 'rxjs';
import { Injectable } from '@angular/core';

@Injectable()
export class MarkdownEditorService {

  private content = new BehaviorSubject('');
  private insertedVariables = new Subject<string>();

  public insertVariable(value: string) {
    this.insertedVariables.next(value);
  }

  public contentChanged(content: string) {
    this.content.next(content);
  }

  public getCurrentContent() {
    return this.content.value;
  }

  public getContent$() {
    return this.content.asObservable();
  }

  public getInsertedVariables$() {
    return this.insertedVariables.asObservable();
  }

}
