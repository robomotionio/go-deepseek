// .harness/packages/util/code-language/lib/index.js
var LANGUAGES = new Map(Object.entries({
  typescript: [
    "ts",
    "tsx",
    "mts",
    "cts"
  ],
  javascript: [
    "js",
    "jsx",
    "mjs",
    "cjs"
  ],
  shellscript: [
    "sh",
    "bash",
    "zsh"
  ],
  fish: ["fish"],
  json: [
    "json",
    "jsonc",
    "jsonl",
    "ndjson",
    "ipynb"
  ],
  csv: ["csv"],
  python: [
    "py",
    "pyw",
    "pyi"
  ],
  ruby: [
    "rb",
    "rake",
    "gemspec"
  ],
  go: ["go"],
  rust: ["rs"],
  java: ["java"],
  c: ["c", "h"],
  cpp: [
    "cc",
    "cpp",
    "cxx",
    "hh",
    "hpp",
    "hxx"
  ],
  csharp: ["cs"],
  kotlin: ["kt", "kts"],
  swift: ["swift"],
  php: ["php"],
  yaml: ["yaml", "yml"],
  toml: ["toml"],
  ini: [
    "ini",
    "conf",
    "cfg",
    "properties"
  ],
  dotenv: ["env"],
  log: ["log"],
  diff: ["diff", "patch"],
  http: ["http"],
  markdown: ["md", "markdown"],
  mdx: ["mdx"],
  rst: ["rst"],
  latex: [
    "tex",
    "sty",
    "cls"
  ],
  bibtex: ["bib"],
  asciidoc: ["adoc"],
  html: [
    "html",
    "htm",
    "xhtml"
  ],
  css: ["css"],
  scss: ["scss"],
  less: ["less"],
  sql: ["sql"],
  xml: [
    "xml",
    "xsd",
    "xsl",
    "xslt",
    "plist",
    "svg"
  ],
  lua: ["lua"],
  bat: ["bat", "cmd"],
  powershell: [
    "ps1",
    "psm1",
    "psd1"
  ],
  r: ["r"],
  julia: ["jl"],
  dart: ["dart"],
  scala: ["scala"],
  clojure: [
    "clj",
    "cljs",
    "edn"
  ],
  erlang: ["erl", "hrl"],
  elixir: ["ex", "exs"],
  haskell: ["hs"],
  fsharp: [
    "fs",
    "fsi",
    "fsx"
  ],
  vb: ["vb"],
  perl: ["pl", "pm"],
  verilog: ["v"],
  "system-verilog": ["sv", "svh"],
  graphql: ["graphql", "gql"],
  proto: ["proto"],
  hcl: [
    "tf",
    "tfvars",
    "hcl"
  ],
  nix: ["nix"],
  vue: ["vue"],
  svelte: ["svelte"],
  make: ["makefile", "mk"],
  cmake: ["cmake"],
  groovy: ["gradle", "groovy"]
}).flatMap(([language, extensions]) => extensions.map((extension) => [extension, language])));
var CODE_HIGHLIGHT_EXTENSIONS = [...LANGUAGES.keys()];
var READ_LANG_BY_EXTENSION = /* @__PURE__ */ new Map([
  ["tsx", "tsx"],
  ["jsx", "jsx"],
  ["tf", "tf"],
  ["tfvars", "tfvars"],
  ["gradle", "gradle"]
]);
var SHORT_BY_LANGUAGE = {
  typescript: "ts",
  javascript: "js",
  shellscript: "sh",
  fish: "fish",
  json: "json",
  csv: "csv",
  python: "py",
  ruby: "rb",
  go: "go",
  rust: "rs",
  java: "java",
  c: "c",
  cpp: "cpp",
  csharp: "cs",
  kotlin: "kotlin",
  swift: "swift",
  php: "php",
  yaml: "yaml",
  toml: "toml",
  ini: "ini",
  dotenv: "env",
  log: "log",
  diff: "diff",
  http: "http",
  markdown: "md",
  mdx: "mdx",
  rst: "rst",
  latex: "tex",
  bibtex: "bib",
  asciidoc: "adoc",
  html: "html",
  css: "css",
  scss: "scss",
  less: "less",
  sql: "sql",
  xml: "xml",
  lua: "lua",
  bat: "bat",
  powershell: "ps1",
  r: "r",
  julia: "jl",
  dart: "dart",
  scala: "scala",
  clojure: "clj",
  erlang: "erl",
  elixir: "ex",
  haskell: "hs",
  fsharp: "fs",
  vb: "vb",
  perl: "pl",
  verilog: "v",
  "system-verilog": "sv",
  graphql: "graphql",
  proto: "proto",
  hcl: "hcl",
  nix: "nix",
  vue: "vue",
  svelte: "svelte",
  make: "make",
  cmake: "cmake",
  groovy: "groovy"
};
function extensionForPath(path) {
  const slash = Math.max(path.lastIndexOf("/"), path.lastIndexOf("\\"));
  const base = path.slice(slash + 1);
  const dot = base.lastIndexOf(".");
  return dot < 0 ? void 0 : base.slice(dot + 1).toLowerCase();
}
function languageForPath(path) {
  const extension = extensionForPath(path);
  return extension === void 0 ? void 0 : LANGUAGES.get(extension);
}
function readLangHintForPath(path) {
  const extension = extensionForPath(path);
  if (extension === void 0) return void 0;
  const canonical = LANGUAGES.get(extension);
  return canonical === void 0 ? void 0 : READ_LANG_BY_EXTENSION.get(extension) ?? SHORT_BY_LANGUAGE[canonical];
}
export {
  CODE_HIGHLIGHT_EXTENSIONS,
  languageForPath,
  readLangHintForPath
};
