/* Gera public/app.html a partir de app-source.html (o código do app). */
const fs = require("fs"), path = require("path");
let src = fs.readFileSync(path.join(__dirname, "app-source.html"), "utf8");
const title = (/<title>[^<]*<\/title>/.exec(src) || ["<title>Controle de Cargas</title>"])[0];
src = src.replace(title, "");
const html = '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">' +
  title + '<style>:root{color-scheme:light}html,body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style></head><body>\n' +
  '<script src="/shim.js"></script>\n' + src + "\n</body></html>\n";
fs.writeFileSync(path.join(__dirname, "public", "app.html"), html);
console.log("app.html gerado:", html.length, "bytes");
