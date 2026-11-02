// Run with Node.js. No dependencies or runtime Markdown conversion.
import { readFileSync, writeFileSync } from 'node:fs';
const source = readFileSync(new URL('../content/book.md', import.meta.url), 'utf8');
const lines = source.replace(/\r\n/g, '\n').split('\n');
const omitted = [];
const kept = [];
for (let i = 0; i < lines.length; i++) {
  if (/^#{1,3} ［(?:小さな|メイン)?(?:図解|スクリーンショット|吹き出し)候補/.test(lines[i])) {
    const start = i;
    while (i < lines.length && lines[i] !== '---') i++;
    if (i === lines.length) throw new Error('制作メモの終端がありません');
    omitted.push({ start: start + 1, end: i + 1, title: lines[start] });
  } else kept.push(lines[i]);
}
const clean = kept.join('\n').replace(/(?:---\s*\n\s*){2,}/g, '---\n\n');
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const inline = s => esc(s).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/  \n/g, '<br>\n').replace(/\n/g, '\n');
// This manuscript uses paragraphs, headings, quotes, lists and inline code.
function render(text) {
  const blocks = text.trim().split(/\n\s*\n/);
  return blocks.map(b => {
    if (b === '---') return '<hr>';
    const h = b.match(/^(#{1,3}) (.+)$/);
    if (h) {
      const level = h[1].length === 1 ? 3 : h[1].length + 1;
      return `<h${level}>${inline(h[2])}</h${level}>`;
    }
    if (/^>/.test(b)) return `<blockquote><p>${inline(b.split('\n').map(l => l.replace(/^> ?/, '')).join('\n'))}</p></blockquote>`;
    if (/^(?:- |\d+\. )/.test(b)) {
      const ordered = /^\d/.test(b), tag = ordered ? 'ol' : 'ul';
      const start = ordered ? ` start="${parseInt(b)}"` : '';
      return `<${tag}${start}>${b.split(/\n(?=(?:- |\d+\. ))/).map(l => `<li>${inline(l.replace(/^(?:- |\d+\. )/, ''))}</li>`).join('')}</${tag}>`;
    }
    return `<p>${inline(b)}</p>`;
  }).join('\n').replace(/<\/ul>\s*<ul>/g, '').replace(/<\/ol>\s*<ol start="\d+">/g, '');
}
const chapters = [];
const re = /^# (はじめに｜.+|第[1-7]章｜.+|おわりに｜.+)$/gm;
const matches = [...clean.matchAll(re)];
if (matches.length !== 9) throw new Error('9章の構成を確認してください');
for (let i = 0; i < matches.length; i++) {
  const m = matches[i], title = m[1];
  const id = i === 0 ? 'intro' : i === 8 ? 'closing' : `chapter-${i}`;
  let body = clean.slice(m.index + m[0].length, matches[i + 1]?.index ?? clean.length);
  // Part heading belongs to the following chapter; retain its exact wording.
  let part = '';
  if (i === 6) part = '<p class="part">Part 2｜AIへ仕事を渡し、任せる</p>';
  body = body.replace(/^# Part 2｜AIへ仕事を渡し、任せる\s*$/m, '');
  let html = render(body);
  html = html.replace(/(<h4>［(?:プロンプト例|実践欄|実践例)[\s\S]*?<\/h4>)\n(<blockquote>[\s\S]*?<\/blockquote>)/g, '<div class="prompt">$1\n$2</div>');
  chapters.push({ id, title, html, part });
}
const toc = chapters.map(c => `<li><a href="#${c.id}"><span>${esc(c.title.split('｜')[0])}</span>${esc(c.title.split('｜')[1])}</a></li>`).join('\n');
const title = 'AIと長く仕事するための、小さな入門書';
const html = `<!doctype html>
<html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex, nofollow"><title>${title}</title><meta name="description" content="AIバックエンド受講前スタートアッププログラム。AIと長く仕事するための環境と運用の基盤を学ぶ、小さな入門書。"><link rel="stylesheet" href="./assets/style.css"><script src="./assets/reading.js" defer></script></head>
<body id="top"><a class="skip" href="#intro">本文へ移動</a>
<div class="layout"><aside class="sidebar"><a class="brand" href="#top">AIと長く仕事するために</a><details class="toc" open><summary>目次 <span id="current">全7章</span></summary><nav aria-label="章の目次"><ol>${toc}</ol></nav></details></aside>
<main><header class="cover"><p class="eyebrow">AIバックエンド受講前スタートアッププログラム</p><h1>AIと長く仕事するための、<br>小さな入門書</h1><p class="cover-note">必要になったときに、必要な章へ。</p><a class="start" href="#intro">はじめにを読む <span aria-hidden="true">↓</span></a></header>
${chapters.map((c, i) => `<section class="chapter" id="${c.id}" aria-labelledby="${c.id}-title">${c.part}<h2 id="${c.id}-title"><span class="chapter-label">${esc(c.title.split('｜')[0])}</span>${esc(c.title.split('｜')[1])}</h2>${c.html}<nav class="chapter-nav" aria-label="${esc(c.title.split('｜')[0])}の前後へ">${i ? `<a href="#${chapters[i - 1].id}">← ${chapters[i - 1].title.split('｜')[0]}</a>` : '<a href="#top">↑ 表紙</a>'}${i < 8 ? `<a href="#${chapters[i + 1].id}">${chapters[i + 1].title.split('｜')[0]} →</a>` : '<a href="#top">↑ 表紙へ戻る</a>'}</nav></section>`).join('\n')}
<footer>AIと長く仕事するための、小さな入門書</footer></main></div></body></html>\n`;
writeFileSync(new URL('../index.html', import.meta.url), html);
console.log(`生成完了: ${chapters.length}章 / 制作メモ ${omitted.length}件を除外`);
for (const x of omitted) console.log(`${x.start}–${x.end}: ${x.title}`);
