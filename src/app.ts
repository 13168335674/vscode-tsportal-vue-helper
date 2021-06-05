"use strict";
import {
  CancellationToken,
  CompletionItem,
  CompletionItemKind,
  CompletionItemProvider,
  CompletionList,
  Disposable,
  Position,
  ProviderResult,
  Range,
  SnippetString,
  TextDocument,
  workspace,
} from "vscode";

import getTags from "./utils/get-tags";
import getAttrs from "./utils/get-attrs";

const _ = require("lodash");
const TAGS = getTags();
const ATTRS = getAttrs();
const prettyHTML = require("pretty");

export interface TagObject {
  text: string;
  offset: number;
}

export class App {
  private _disposable!: Disposable;
  public WORD_REG: RegExp =
    /(-?\d*\.\d\w*)|([^\`\~\!\@\$\^\&\*\(\)\=\+\[\{\]\}\\\|\;\:\'\"\,\.\<\>\/\s]+)/gi;

  setConfig() {
    // https://github.com/Microsoft/vscode/issues/24464
    const config = workspace.getConfiguration("editor");
    const quickSuggestions = config.get("quickSuggestions");
    if (!quickSuggestions["strings"]) {
      config.update("quickSuggestions", { strings: true }, true);
    }
  }

  dispose() {
    this._disposable.dispose();
  }
}

export class AntdvCompletionItemProvider implements CompletionItemProvider {
  private _document: TextDocument;
  private _position: Position;
  private tagReg: RegExp = /<([\w-]+)\s+/g;
  private attrReg: RegExp = /(?:\(|\s*)([-\w]+)=['"][^'"]*/;
  private tagStartReg: RegExp = /<([\w-]*)$/;
  private size: number;
  private quotes: string;

  getTextBeforePosition(position: Position): string {
    var start = new Position(position.line, 0);
    var range = new Range(start, position);
    return this._document.getText(range);
  }

  isTagStart() {
    let txt = this.getTextBeforePosition(this._position);
    return this.tagStartReg.test(txt);
  }

  // tentative plan for vue file
  notInTemplate(): boolean {
    let line = this._position.line;
    while (line) {
      if (/^\s*<script.*>\s*$/.test(<string>this._document.lineAt(line).text)) {
        return true;
      }
      line--;
    }
    return false;
  }

  getTagSuggestion() {
    let suggestions = [];

    let id = 100;
    for (let tag in TAGS) {
      suggestions.push(this.buildTagSuggestion(tag, TAGS[tag], id));
      id++;
    }
    return suggestions;
  }

  buildTagSuggestion(tag, tagVal, id) {
    const snippets = [];
    let index = 0;
    let that = this;
    function build(tag, { subtags, defaults }, snippets) {
      let attrs = "";
      defaults &&
        defaults.forEach((item, i) => {
          attrs += ` ${item}=${that.quotes}$${index + i + 1}${that.quotes}`;
        });
      snippets.push(`${index > 0 ? "<" : ""}${tag}${attrs}>`);
      index++;
      subtags && subtags.forEach((item) => build(item, TAGS[item], snippets));
      snippets.push(`</${tag}>`);
    }
    build(tag, tagVal, snippets);

    return {
      label: tag,
      sortText: `0${id}${tag}`,
      insertText: new SnippetString(
        prettyHTML("<" + snippets.join(""), { indent_size: this.size }).substr(
          1
        )
      ),
      kind: CompletionItemKind.Snippet,
      detail: "Vue Components Helper",
      documentation: tagVal.description,
    };
  }

  getPreTag(): TagObject | undefined {
    let line = this._position.line;
    let tag: TagObject | string;
    let txt = this.getTextBeforePosition(this._position);

    while (this._position.line - line < 10 && line >= 0) {
      if (line !== this._position.line) {
        txt = this._document.lineAt(line).text;
      }
      tag = this.matchTag(this.tagReg, txt, line);

      if (tag === "break") return;
      if (tag) return <TagObject>tag;
      line--;
    }
    return;
  }

  matchTag(reg: RegExp, txt: string, line: number): TagObject | string {
    let match: RegExpExecArray;
    let arr: TagObject[] = [];

    if (
      /<\/?[-\w]+[^<>]*>[\s\w]*<?\s*[\w-]*$/.test(txt) ||
      (this._position.line === line &&
        (/^\s*[^<]+\s*>[^<\/>]*$/.test(txt) ||
          /[^<>]*<$/.test(txt[txt.length - 1])))
    ) {
      return "break";
    }
    while ((match = reg.exec(txt))) {
      arr.push({
        text: match[1],
        offset: this._document.offsetAt(new Position(line, match.index)),
      });
    }
    return arr.pop();
  }

  getPreAttr(): string | undefined {
    let txt = this.getTextBeforePosition(this._position).replace(
      /"[^'"]*(\s*)[^'"]*$/,
      ""
    );
    let end = this._position.character;
    let start = txt.lastIndexOf(" ", end) + 1;
    let parsedTxt = this._document.getText(
      new Range(this._position.line, start, this._position.line, end)
    );

    return this.matchAttr(this.attrReg, parsedTxt);
  }

  matchAttr(reg: RegExp, txt: string): string {
    let match: RegExpExecArray;
    match = reg.exec(txt);
    return !/"[^"]*"/.test(txt) && match && match[1];
  }

  isAttrValueStart(tag: Object | string | undefined, attr) {
    return tag && attr;
  }

  getAttrValueSuggestion(tag: string, attr: string): CompletionItem[] {
    let suggestions = [];
    const values = this.getAttrValues(tag, attr);
    values.forEach((value) => {
      suggestions.push({
        label: value,
        kind: CompletionItemKind.Value,
      });
    });
    return suggestions;
  }

  getAttrValues(tag, attr) {
    let attrItem = this.getAttrItem(tag, attr);
    let options = attrItem && attrItem.options;
    if (!options && attrItem) {
      if (attrItem.type === "boolean") {
        options = ["true", "false"];
      }
    }
    return options || [];
  }

  getAttrItem(tag: string | undefined, attr: string | undefined) {
    attr = _.kebabCase(attr);
    return ATTRS[`${tag}/${attr}`] || ATTRS[attr];
  }

  isAttrStart(tag: TagObject | undefined) {
    return tag;
  }

  getAttrSuggestion(tag: string) {
    let suggestions = [];
    let tagAttrs = this.getTagAttrs(tag);
    let preText = this.getTextBeforePosition(this._position);
    let prefix = preText
      .replace(/['"]([^'"]*)['"]$/, "")
      .split(/\s|\(+/)
      .pop();
    // method attribute
    const method = prefix[0] === "@";
    // bind attribute
    const bind = prefix[0] === ":";

    prefix = prefix.replace(/[:@]/, "");

    if (/[^@:a-zA-z\s]/.test(prefix[0])) {
      return suggestions;
    }

    tagAttrs.forEach((attr) => {
      const attrItem = this.getAttrItem(tag, attr);
      if (attrItem && (!prefix.trim() || this.firstCharsEqual(attr, prefix))) {
        const sug = this.buildAttrSuggestion(
          { attr, tag, bind, method },
          attrItem
        );
        sug && suggestions.push(sug);
      }
    });
    // for (let attr in ATTRS) {
    //   const attrItem = this.getAttrItem(tag, attr);
    //   if (attrItem && attrItem.global && (!prefix.trim() || this.firstCharsEqual(attr, prefix))) {
    //     const sug = this.buildAttrSuggestion({attr, tag: null, bind, method}, attrItem);
    //     sug && suggestions.push(sug);
    //   }
    // }

    return suggestions;
  }

  getTagAttrs(tag: string) {
    return (TAGS[tag] && TAGS[tag].attributes) || [];
  }

  buildAttrSuggestion(
    { attr, tag, bind, method },
    { description, type, optionType, defaultValue }
  ) {
    if (
      (method && type === "method") ||
      (bind && type !== "method") ||
      (!method && !bind)
    ) {
      let documentation = description;
      optionType && (documentation += "\n" + `type: ${optionType}`);
      defaultValue && (documentation += "\n" + `default: ${defaultValue}`);
      return {
        label: attr,
        insertText:
          type && type === "flag"
            ? `${attr} `
            : new SnippetString(`${attr}=${this.quotes}$1${this.quotes}$0`),
        kind:
          type && type === "method"
            ? CompletionItemKind.Method
            : CompletionItemKind.Property,
        detail: "Vue Components Helper",
        documentation,
      };
    } else {
      return;
    }
  }

  firstCharsEqual(str1: string, str2: string) {
    if (str2 && str1) {
      return str1[0].toLowerCase() === str2[0].toLowerCase();
    }
    return false;
  }

  provideCompletionItems(
    document: TextDocument,
    position: Position,
    token: CancellationToken
  ): ProviderResult<CompletionItem[] | CompletionList> {
    this._document = document;
    this._position = position;

    const config = workspace.getConfiguration("vscode-vue-components-helper");
    this.size = config.get("indent-size");
    const normalQuotes = config.get("quotes") === "double" ? '"' : "'";
    this.quotes = normalQuotes;

    let tag: TagObject | string | undefined = this.getPreTag();
    let attr = this.getPreAttr();

    if (this.isAttrValueStart(tag, attr)) {
      console.log(
        `isAttrValueStart`,
        this.getAttrValueSuggestion(tag.text, attr)
      );
      return this.getAttrValueSuggestion(tag.text, attr);
    } else if (this.isAttrStart(tag)) {
      this.getAttrSuggestion(tag.text);
      console.log(`isAttrStart`, this.getAttrSuggestion(tag.text));
      return this.getAttrSuggestion(tag.text);
    } else if (this.isTagStart()) {
      switch (document.languageId) {
        case "vue":
          console.log(
            `isTagStart`,
            this.notInTemplate() ? [] : this.getTagSuggestion()
          );
          return this.notInTemplate() ? [] : this.getTagSuggestion();
        case "html":
          console.log(`isTagStart`, this.getTagSuggestion());
          return this.getTagSuggestion();
      }
    } else {
      return [];
    }
  }
}
