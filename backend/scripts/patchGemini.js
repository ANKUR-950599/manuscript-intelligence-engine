const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const targetFiles = [];

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
    } else if (entry.isFile() && fullPath.endsWith('.js')) {
      targetFiles.push(fullPath);
    }
  }
}

walk(root);

const replacements = [
  { from: /require\(\"\.\/clients\/groqClient\"\)/g, to: 'require("./clients/geminiClient")' },
  { from: /const \{ groqGenerate, groqEmbed \} = require\(\"\.\/clients\/groqClient\"\);/g, to: 'const { geminiGenerate, geminiEmbed } = require("./clients/geminiClient");' },
  { from: /const \{ groqGenerate \} = require\(\"\.\/clients\/groqClient\"\);/g, to: 'const { geminiGenerate } = require("./clients/geminiClient");' },
  { from: /groqGenerate\(/g, to: 'geminiGenerate(' },
  { from: /groqEmbed\(/g, to: 'geminiEmbed(' },
  { from: /GEMINI_API_KEY/g, to: 'GEMINI_API_KEY' },
  { from: /GEMINI_EMBEDDING_MODEL/g, to: 'GEMINI_EMBEDDING_MODEL' },
  { from: /llama-3\.1-8b-instant/g, to: 'gemini-3.1-flash-lite' },
  { from: /Gemini gemini-3.1-flash-lite/g, to: 'Gemini gemini-3.1-flash-lite' },
  { from: /Gemini AI CLIENT/g, to: 'Gemini AI CLIENT' },
  { from: /Gemini Embedding Error/g, to: 'Gemini Embedding Error' },
  { from: /Gemini API Error/g, to: 'Gemini API Error' },
  { from: /Gemini generation failed/g, to: 'Gemini generation failed' },
  { from: /Gemini embedding failed/g, to: 'Gemini embedding failed' },
  { from: /Gemini Fallback Error/g, to: 'Gemini Fallback Error' },
  { from: /Gemini/g, to: 'Gemini' }
];

for (const file of targetFiles) {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;
  for (const { from, to } of replacements) {
    content = content.replace(from, to);
  }
  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Patched', path.relative(root, file));
  }
}
