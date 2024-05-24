# Website

This website is built using [Docusaurus](https://docusaurus.io/), a modern static website generator.

### Installation

```
$ yarn
```

### Local Development

```
$ yarn start
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

### Build

```
$ yarn build
```

### Markdown Syntax

Docusaurus uses MDX rather than standard markdown, so all "html" style code would need to be written using "jsx" style code instead.


### Typesetting Conventions

* Use [Admonitions](https://docusaurus.io/docs/markdown-features/admonitions) for info, tip, warning, etc. For example, a tip would look like this in Markdown: 
```
:::warning

Some **content** with _Markdown_ `syntax`. Check [this `api`](#).

:::
```
* Use opening and closing double quotes “ ” when you want to use quotes. 
    * “ opening - is Option + [ on Mac
    * ” closing - is Option + Shift + [ on Mac.
    * Don't use code-style quotes ". Don't use single quotes at all. 
* Use code highlighting whenever you're mentioning something that's code, like a `function_name()`. 
* Use dashes properly:
    * em-dash: — use instead of comma; use sparingly. [Option + Shift + Dash (-) on Mac]
    * en-dash: – use for number ranges, 2–3 items. [Option + Dash (-) on Mac] 
    * hyphen: - use for hyphenation


