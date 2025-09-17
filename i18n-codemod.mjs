// i18n-codemod.mjs
// Usage: node i18n-codemod.mjs
// Ne yapar?
// 1) messages/_extracted.json (common) içindeki metin->key haritasını okur
// 2) "use client" olan .tsx/.jsx dosyalarda:
//    - {"metin"} ve >metin< düğümlerini güvenle <T k="..."/> ile değiştirir
//    - Gerekirse `import T from "@/src/i18n/T";` ekler
// Not: TS generic içeren satırları atlar (bozmaz)

import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const messagesPath = path.join(projectRoot, "messages", "_extracted.json");

if (!fs.existsSync(messagesPath)) {
    console.error("messages/_extracted.json bulunamadı. Önce extraction yapmalısın.");
    process.exit(1);
}

const extracted = JSON.parse(fs.readFileSync(messagesPath, "utf8"));
const textToKey = Object.fromEntries(
    Object.entries(extracted.common || {}).map(([k, v]) => [String(v), String(k)])
);

const exts = [".tsx", ".jsx"];
const files = walk(projectRoot).filter(p =>
    exts.includes(path.extname(p)) &&
    !p.includes("node_modules") &&
    !p.includes(".next")
);

let changedFiles = 0, totalRepl = 0;

for (const file of files) {
    let code = fs.readFileSync(file, "utf8");
    if (!isClientComponent(code)) continue;

    const orig = code;

    // 1) {"metin"} -> {<T k="..." />}
    code = code.replace(/\{(?:\s*['"]([^{}<>\n]{2,}?)['"]\s*)\}/g, (m, g1) => {
        const line = getLine(code, m);
        if (!isSafeLine(line)) return m;
        const s = (g1 || "").trim();
        if (!s || s.length > 120) return m;
        const k = textToKey[s];
        return k ? `{<T k="${k}" />}` : m;
    });

    // 2) >metin<  -> ><T k="..." /><
    code = code.replace(/>(?!\s*<)([^<>{}][^<>{}]*)</g, (m, g1) => {
        const s = (g1 || "").trim();
        if (!s || s.length > 120) return m;
        const k = textToKey[s];
        return k ? `><T k="${k}" /><` : m;
    });

    if (code !== orig) {
        if (!code.includes(`from "@/src/i18n/T"`)) {
            code = addImportT(code);
        }
        fs.writeFileSync(file, code, "utf8");
        changedFiles++;
    }
}

console.log("Client dosya değişimi:", changedFiles);

function walk(dir) {
    const out = [];
    for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
        const p = path.join(dir, entry.name);
        if (entry.isDirectory()) out.push(...walk(p));
        else out.push(p);
    }
    return out;
}

function isClientComponent(code) {
    const lines = code.split(/\r?\n/);
    for (const line of lines) {
        const t = line.trim();
        if (!t) continue;
        return t === '"use client"' || t === "'use client'";
    }
    return false;
}

function getLine(text, matchStr) {
    const idx = text.indexOf(matchStr);
    if (idx === -1) return "";
    const start = text.lastIndexOf("\n", idx) + 1;
    const end = text.indexOf("\n", idx);
    return text.slice(start, end === -1 ? text.length : end);
}

function isSafeLine(line) {
    // TS generic/type param satırlarını atla
    if (/:.*?<[^>]+>/.test(line)) return false;            // foo: Bar<Baz>
    if (/\w+\s*<[^>]+>\s*\(/.test(line)) return false;     // fn<T>(...
    if (line.includes("useRef<") || line.includes("Promise<")) return false;
    return true;
}

function addImportT(code) {
    const importLines = [...code.matchAll(/^\s*import .*?;$/gm)];
    if (importLines.length) {
        const last = importLines[importLines.length - 1];
        const pos = last.index + last[0].length;
        return code.slice(0, pos) + `\nimport T from "@/src/i18n/T";` + code.slice(pos);
    }
    return `import T from "@/src/i18n/T";\n` + code;
}
