import { Helmet, jsx, renderSSR } from "nano-jsx";
import { marked } from "marked";
import Package from "../../components/package.js";

async function customFetch(url, options){
  const response = await fetch(url, options);
  if(response.status === 404 || response.status === 500){
    throw new Error(`fetch error on ${url}`);
  }
  return response;
}

async function onRequestGet({ params, env, waitUntil }) {
  try {
    const NPM_PROVIDER_URL = "https://ga.jspm.io/npm:";
    const packageName = params.package.join("/");
    const baseURL = `${NPM_PROVIDER_URL}${packageName}`;
    const jspmPackage = await fetch(
      `${baseURL}/package.json`,
      {
        cf: {
          cacheTtlByStatus: { "200-299": 86400, 404: 1, "500-599": 0 },
        },
      },
    )
    const readmeFilesToFetch = ["README.md", "readme.md"];

    const readmeResponse = await Promise.any(
      readmeFilesToFetch.map((file) =>
      customFetch(
          `${baseURL}/${file}`,
          {
            cf: {
              cacheTtlByStatus: { "200-299": 86400, 404: 1, "500-599": 0 },
            },
          },
        )
      ),
    );

    const readmeFileContent = await readmeResponse.text();

    const readmeHTML = marked.parse(readmeFileContent);

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

    const app = renderSSR(
      jsx
        `<${Package} name=${name} description=${description} version=${version} homepage=${homepage} license=${license} files=${files} exports=${exports} readme=${readmeHTML} keywords=${keywords} />`,
    );

    const { body, head, footer } = Helmet.SSR(app);

    const css = `
      jspm-package-name, jspm-package-version, jspm-package-description, jspm-package-license, jspm-package-file{
          display: block;
      }
    `;

    const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <title>${name}@${version} - JSPM</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="description" content=${description}>
        <style>
          ${css}
        </style>
        ${head.join("\n")}
      </head>
      <body>
        ${body}
        ${footer.join("\n")}
      </body>
    </html>`;

    return new Response(html, {
      headers: {
        "content-type": "text/html; charset=UTF-8",
        "Cache-Control": "s-maxage=1500",
      },
    });
  } catch (error) {
    return new Response(`${error.message}\n${error.stack}`, { status: 500 });
  }
}

export { onRequestGet };
