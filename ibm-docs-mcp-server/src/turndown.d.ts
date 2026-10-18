declare module 'turndown' {
  interface Options {
    headingStyle?: 'setext' | 'atx';
    hr?: string;
    bulletListMarker?: '-' | '+' | '*';
    codeBlockStyle?: 'indented' | 'fenced';
    emDelimiter?: '_' | '*';
    strongDelimiter?: '**' | '__';
    linkStyle?: 'inlined' | 'referenced';
  }

  class TurndownService {
    constructor(options?: Options);
    turndown(html: string | Node): string;
    use(plugin: any): this;
    addRule(key: string, rule: any): this;
    keep(filter: string[] | ((node: any) => boolean)): this;
    remove(filter: string[] | ((node: any) => boolean)): this;
  }

  export default TurndownService;
}
