var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};

// .harness/node_modules/.pnpm/@joplin+turndown-plugin-gfm@1.0.67/node_modules/@joplin/turndown-plugin-gfm/lib/turndown-plugin-gfm.cjs.js
var require_turndown_plugin_gfm_cjs = __commonJS({
  ".harness/node_modules/.pnpm/@joplin+turndown-plugin-gfm@1.0.67/node_modules/@joplin/turndown-plugin-gfm/lib/turndown-plugin-gfm.cjs.js"(exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    var highlightRegExp = /highlight-(?:text|source)-([a-z0-9]+)/;
    function highlightedCodeBlock(turndownService) {
      turndownService.addRule("highlightedCodeBlock", {
        filter: function(node) {
          var firstChild = node.firstChild;
          return node.nodeName === "DIV" && highlightRegExp.test(node.className) && firstChild && firstChild.nodeName === "PRE";
        },
        replacement: function(content, node, options) {
          var className = node.className || "";
          var language = (className.match(highlightRegExp) || [null, ""])[1];
          return "\n\n" + options.fence + language + "\n" + node.firstChild.textContent + "\n" + options.fence + "\n\n";
        }
      });
    }
    function strikethrough(turndownService) {
      turndownService.addRule("strikethrough", {
        filter: ["del", "s", "strike"],
        replacement: function(content) {
          return "~~" + content + "~~";
        }
      });
    }
    var indexOf = Array.prototype.indexOf;
    var every = Array.prototype.every;
    var rules = {};
    var alignMap = { left: ":---", right: "---:", center: ":---:" };
    var isCodeBlock_ = null;
    var options_ = null;
    var tableShouldBeSkippedCache_ = /* @__PURE__ */ new WeakMap();
    function getAlignment(node) {
      return node ? (node.getAttribute("align") || node.style.textAlign || "").toLowerCase() : "";
    }
    function getBorder(alignment) {
      return alignment ? alignMap[alignment] : "---";
    }
    function getColumnAlignment(table, columnIndex) {
      var votes = {
        left: 0,
        right: 0,
        center: 0,
        "": 0
      };
      var align = "";
      for (var i = 0; i < table.rows.length; ++i) {
        var row = table.rows[i];
        if (columnIndex < row.childNodes.length) {
          var cellAlignment = getAlignment(row.childNodes[columnIndex]);
          ++votes[cellAlignment];
          if (votes[cellAlignment] > votes[align]) {
            align = cellAlignment;
          }
        }
      }
      return align;
    }
    rules.tableCell = {
      filter: ["th", "td"],
      replacement: function(content, node) {
        if (tableShouldBeSkipped(nodeParentTable(node))) return content;
        return cell(content, node);
      }
    };
    rules.tableRow = {
      filter: "tr",
      replacement: function(content, node) {
        const parentTable = nodeParentTable(node);
        if (tableShouldBeSkipped(parentTable)) return content;
        var borderCells = "";
        if (isHeadingRow(node)) {
          const colCount = tableColCount(parentTable);
          for (var i = 0; i < colCount; i++) {
            const childNode = i < node.childNodes.length ? node.childNodes[i] : null;
            var border = getBorder(getColumnAlignment(parentTable, i));
            borderCells += cell(border, childNode, i);
          }
        }
        return "\n" + content + (borderCells ? "\n" + borderCells : "");
      }
    };
    rules.table = {
      filter: function(node, options) {
        return node.nodeName === "TABLE";
      },
      replacement: function(content, node) {
        if (tableShouldBeHtml(node, options_)) {
          let html = node.outerHTML;
          let divParent = nodeParentDiv(node);
          if (divParent === null || !divParent.classList.contains("joplin-table-wrapper")) {
            return `

<div class="joplin-table-wrapper">${html}</div>

`;
          } else {
            return html;
          }
        } else {
          if (tableShouldBeSkipped(node)) return content;
          content = content.replace(/\n+/g, "\n");
          var secondLine = content.trim().split("\n");
          if (secondLine.length >= 2) secondLine = secondLine[1];
          var secondLineIsDivider = /\| :?---/.test(secondLine);
          var columnCount = tableColCount(node);
          var emptyHeader = "";
          if (columnCount && !secondLineIsDivider) {
            emptyHeader = "|" + "     |".repeat(columnCount) + "\n|";
            for (var columnIndex = 0; columnIndex < columnCount; ++columnIndex) {
              emptyHeader += " " + getBorder(getColumnAlignment(node, columnIndex)) + " |";
            }
          }
          const captionNode = node.querySelector ? node.querySelector("caption") : node.caption;
          const captionContent = captionNode ? captionNode.textContent || "" : "";
          const caption = captionContent ? `${captionContent}

` : "";
          const tableContent = `${emptyHeader}${content}`.trimStart();
          return `

${caption}${tableContent}

`;
        }
      }
    };
    rules.tableCaption = {
      filter: ["caption"],
      replacement: () => ""
    };
    rules.tableColgroup = {
      filter: ["colgroup", "col"],
      replacement: () => ""
    };
    rules.tableSection = {
      filter: ["thead", "tbody", "tfoot"],
      replacement: function(content) {
        return content;
      }
    };
    function isHeadingRow(tr) {
      var parentNode = tr.parentNode;
      return parentNode.nodeName === "THEAD" || parentNode.firstChild === tr && (parentNode.nodeName === "TABLE" || isFirstTbody(parentNode)) && every.call(tr.childNodes, function(n) {
        return n.nodeName === "TH";
      });
    }
    function isFirstTbody(element) {
      var previousSibling = element.previousSibling;
      return element.nodeName === "TBODY" && (!previousSibling || previousSibling.nodeName === "THEAD" && /^\s*$/i.test(previousSibling.textContent));
    }
    function cell(content, node = null, index = null) {
      if (index === null) index = indexOf.call(node.parentNode.childNodes, node);
      var prefix = " ";
      if (index === 0) prefix = "| ";
      let filteredContent = content.trim().replace(/\n\r/g, "<br>").replace(/\n/g, "<br>");
      filteredContent = filteredContent.replace(/\|+/g, "\\|");
      while (filteredContent.length < 3) filteredContent += " ";
      if (node) filteredContent = handleColSpan(filteredContent, node, " ");
      return prefix + filteredContent + " |";
    }
    function nodeContainsTable(node) {
      if (!node.childNodes) return false;
      for (let i = 0; i < node.childNodes.length; i++) {
        const child = node.childNodes[i];
        if (child.nodeName === "TABLE") return true;
        if (nodeContainsTable(child)) return true;
      }
      return false;
    }
    var nodeContains = (node, types) => {
      if (!node.childNodes) return false;
      for (let i = 0; i < node.childNodes.length; i++) {
        const child = node.childNodes[i];
        if (types === "code" && isCodeBlock_ && isCodeBlock_(child)) return true;
        if (types.includes(child.nodeName)) return true;
        if (nodeContains(child, types)) return true;
      }
      return false;
    };
    var customStyleProperties = [
      "background-color",
      "background",
      "border-color",
      "border",
      "border-top",
      "border-right",
      "border-bottom",
      "border-left",
      "border-style",
      "border-width",
      "padding",
      "padding-top",
      "padding-right",
      "padding-bottom",
      "padding-left",
      "float",
      "margin-left",
      "margin-right"
    ];
    var customAttributeNames = [
      "bgcolor",
      "bordercolor",
      "background"
    ];
    var nodeHasCustomStyle = (node) => {
      if (!node || !node.getAttribute) return false;
      const styleAttr = node.getAttribute("style");
      if (!styleAttr) return false;
      const properties = styleAttr.split(";").map((s) => s.split(":")[0].trim().toLowerCase()).filter((s) => s.length > 0);
      for (let i = 0; i < properties.length; i++) {
        if (customStyleProperties.includes(properties[i])) return true;
      }
      return false;
    };
    var hasNonDefaultSpacingAttribute = (node, name) => {
      if (!node || !node.getAttribute) return false;
      const value = node.getAttribute(name);
      if (value === null) return false;
      const normalisedValue = `${value}`.trim().toLowerCase();
      if (!normalisedValue) return false;
      if (normalisedValue === "0" || normalisedValue === "0px") return false;
      return true;
    };
    var nodeHasCustomAttributes = (node) => {
      if (!node || !node.getAttribute) return false;
      for (let i = 0; i < customAttributeNames.length; i++) {
        const value = node.getAttribute(customAttributeNames[i]);
        if (value !== null && `${value}`.trim() !== "") return true;
      }
      if (node.nodeName === "TABLE") {
        if (hasNonDefaultSpacingAttribute(node, "cellpadding")) return true;
        if (hasNonDefaultSpacingAttribute(node, "cellspacing")) return true;
      }
      return false;
    };
    var nodeHasCustomFormatting = (node) => {
      return nodeHasCustomStyle(node) || nodeHasCustomAttributes(node);
    };
    var tableHasCustomStyles = (tableNode) => {
      if (nodeHasCustomFormatting(tableNode)) return true;
      const rows = tableNode.rows;
      if (!rows) return false;
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (nodeHasCustomFormatting(row)) return true;
        for (let j = 0; j < row.childNodes.length; j++) {
          const cell2 = row.childNodes[j];
          if ((cell2.nodeName === "TD" || cell2.nodeName === "TH") && nodeHasCustomFormatting(cell2)) {
            return true;
          }
        }
      }
      return false;
    };
    var tableShouldBeHtml = (tableNode, options) => {
      const possibleTags = [
        "UL",
        "OL",
        "H1",
        "H2",
        "H3",
        "H4",
        "H5",
        "H6",
        "HR",
        "BLOCKQUOTE"
      ];
      if (options.preserveNestedTables) possibleTags.push("TABLE");
      return nodeContains(tableNode, "code") || nodeContains(tableNode, possibleTags) || options.preserveTableStyles && tableHasCustomStyles(tableNode);
    };
    function tableShouldBeSkipped(tableNode) {
      const cached = tableShouldBeSkippedCache_.get(tableNode);
      if (cached !== void 0) return cached;
      const result = tableShouldBeSkipped_(tableNode);
      tableShouldBeSkippedCache_.set(tableNode, result);
      return result;
    }
    function tableShouldBeSkipped_(tableNode) {
      if (!tableNode) return true;
      if (!tableNode.rows) return true;
      if (tableNode.rows.length === 1 && tableNode.rows[0].childNodes.length <= 1) return true;
      if (nodeContainsTable(tableNode)) return true;
      return false;
    }
    function nodeParentDiv(node) {
      let parent = node.parentNode;
      while (parent.nodeName !== "DIV") {
        parent = parent.parentNode;
        if (!parent) return null;
      }
      return parent;
    }
    function nodeParentTable(node) {
      let parent = node.parentNode;
      while (parent.nodeName !== "TABLE") {
        parent = parent.parentNode;
        if (!parent) return null;
      }
      return parent;
    }
    function handleColSpan(content, node, emptyChar) {
      const colspan = node.getAttribute("colspan") || 1;
      for (let i = 1; i < colspan; i++) {
        content += " | " + emptyChar.repeat(3);
      }
      return content;
    }
    function tableColCount(node) {
      let maxColCount = 0;
      for (let i = 0; i < node.rows.length; i++) {
        const row = node.rows[i];
        const colCount = row.childNodes.length;
        if (colCount > maxColCount) maxColCount = colCount;
      }
      return maxColCount;
    }
    function tables(turndownService) {
      isCodeBlock_ = turndownService.isCodeBlock;
      options_ = turndownService.options;
      turndownService.keep(function(node) {
        if (node.nodeName === "TABLE" && tableShouldBeHtml(node, turndownService.options)) return true;
        return false;
      });
      for (var key in rules) turndownService.addRule(key, rules[key]);
    }
    function taskListItems(turndownService) {
      turndownService.addRule("taskListItems", {
        filter: function(node) {
          const parent = node.parentNode;
          const grandparent = parent.parentNode;
          const grandparentIsListItem = !!grandparent && grandparent.nodeName === "LI";
          return (node.type === "checkbox" || node.getAttribute("role") === "checkbox") && (parent.nodeName === "LI" || parent.nodeName === "LABEL" && grandparentIsListItem || parent.nodeName === "SPAN" && grandparentIsListItem);
        },
        replacement: function(content, node) {
          const checked = node.nodeName === "INPUT" ? node.checked : node.getAttribute("aria-checked") === "true";
          return (checked ? "[x]" : "[ ]") + " ";
        }
      });
    }
    function gfm(turndownService) {
      turndownService.use([
        highlightedCodeBlock,
        strikethrough,
        tables,
        taskListItems
      ]);
    }
    exports.gfm = gfm;
    exports.highlightedCodeBlock = highlightedCodeBlock;
    exports.strikethrough = strikethrough;
    exports.tables = tables;
    exports.taskListItems = taskListItems;
  }
});
const __cjs = require_turndown_plugin_gfm_cjs();
export default __cjs;
export const gfm = __cjs?.gfm;

