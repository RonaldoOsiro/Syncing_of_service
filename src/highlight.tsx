/* Tiny sticky-regex line tokenizer. Code embedded in this project
   avoids multi-line template strings, so per-line tokenizing is safe. */

export type Lang = "js" | "json" | "sh";

type Rule = { re: RegExp; cls: string };

const JS_RULES: Rule[] = [
  { re: /\/\/.*/y, cls: "tk-com" },
  { re: /"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`/y, cls: "tk-str" },
  {
    re: /\b(?:const|let|var|function|return|if|else|for|while|do|new|require|await|async|try|catch|finally|throw|typeof|of|in|switch|case|break|continue|default|class|extends|this|delete|yield)\b/y,
    cls: "tk-kw",
  },
  { re: /\b(?:true|false|null|undefined|NaN)\b/y, cls: "tk-lit" },
  { re: /\d[\d_]*(?:\.\d+)?/y, cls: "tk-num" },
  { re: /[A-Za-z_$][\w$]*(?=\s*\()/y, cls: "tk-fn" },
];

const SH_RULES: Rule[] = [
  { re: /#.*/y, cls: "tk-com" },
  { re: /"(?:[^"\\\n]|\\.)*"|'[^'\n]*'/y, cls: "tk-str" },
  { re: /\$\{[^}]*\}|\$[A-Za-z_]\w*|\$[?#@!*]/y, cls: "tk-var" },
  {
    re: /\b(?:curl|openssl|echo|export|set|date|uuidgen|node|npm|npx|awk|printf|bash|sh|cd|mkdir|cp|touch|chmod|git|jq)\b/y,
    cls: "tk-kw",
  },
  { re: /\d[\d_]*(?:\.\d+)?/y, cls: "tk-num" },
];

const JSON_RULES: Rule[] = [
  { re: /"(?:[^"\\\n]|\\.)*"(?=\s*:)/y, cls: "tk-key" },
  { re: /"(?:[^"\\\n]|\\.)*"/y, cls: "tk-str" },
  { re: /\b(?:true|false|null)\b/y, cls: "tk-lit" },
  { re: /-?\d+(?:\.\d+)?/y, cls: "tk-num" },
];

const RULES: Record<Lang, Rule[]> = { js: JS_RULES, json: JSON_RULES, sh: SH_RULES };

export function highlightLine(
  line: string,
  lang: Lang
): { text: string; cls: string }[] {
  const rules = RULES[lang];
  const out: { text: string; cls: string }[] = [];
  let i = 0;
  while (i < line.length) {
    let matched = false;
    for (const rule of rules) {
      rule.re.lastIndex = i;
      const m = rule.re.exec(line);
      if (m && m.index === i && m[0].length > 0) {
        out.push({ text: m[0], cls: rule.cls });
        i += m[0].length;
        matched = true;
        break;
      }
    }
    if (!matched) {
      const last = out[out.length - 1];
      if (last && last.cls === "") last.text += line[i];
      else out.push({ text: line[i], cls: "" });
      i++;
    }
  }
  return out;
}
