import { Helmet, jsx, renderSSR } from "nano-jsx";
import { marked } from "marked";
import Package from "../../components/package.js";

async function onRequestGet({ params }) {
  const NPM_PROVIDER_URL = "https://ga.jspm.io/npm:";
  const packageName = params.package.join("/");

  const jspmPackage = await fetch(
    `${NPM_PROVIDER_URL}${packageName}/package.json`,
  );
  const {
    name,
    description,
    keywords,
    version,
    homepage,
    license,
    files,
    exports,
  } = await jspmPackage.json();
  const readmeFileName = files.find((file) =>
    file.toLowerCase() === "readme.md"
  );
  const readmeFile = await fetch(
    `${NPM_PROVIDER_URL}${packageName}/${readmeFileName}`,
  );
  const readmeFileContent = await readmeFile.text();
  const readmeHTML = marked.parse(readmeFileContent);
  const app = renderSSR(
    jsx
      `<${Package} name=${name} description=${description} version=${version} homepage=${homepage} license=${license} files=${files} exports=${exports} readme=${readmeHTML} />`,
  );
  const { body, head, footer } = Helmet.SSR(app);

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,700&family=Source+Code+Pro&display=swap');

      body{
          font-family: 'Playfair Display', serif;
      }
      code{
          font-family: 'Source Code Pro', monospace;
      }
      jspm-package-name, jspm-package-version, jspm-package-description, jspm-package-license, jspm-package-file{
          display: block;
      }
    `;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          ${css}
        <style>
        ${head.join("\n")}
      </head>
      <body>
        ${body}
        ${footer.join("\n")}
      </body>
    </html>`;

  return new Response(html, {
    headers: { "content-type": "text/html; charset=UTF-8" },
  });
}

export { onRequestGet };
