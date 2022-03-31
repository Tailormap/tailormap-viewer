export interface ElementAttributes {
  nodeName: string;
  textContent?: string;
  className?: string;
  children?: ElementAttributes[];
}

export class HtmlHelper {

  public static createElement(elementAttributes: ElementAttributes): HTMLElement {
    const el = document.createElement(elementAttributes.nodeName);
    if (elementAttributes.textContent) {
      el.textContent = elementAttributes.textContent;
    }
    if (elementAttributes.className) {
      el.className = elementAttributes.className;
    }
    if (elementAttributes.children) {
      elementAttributes.children.forEach(child => {
        el.appendChild(HtmlHelper.createElement(child));
      });
    }
    return el;
  }

}
