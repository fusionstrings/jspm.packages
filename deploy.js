// currently copy of server.js with Deno.readFile instead of fetch
import { serve } from "https://deno.land/std@0.117.0/http/server.ts";
import {
  contentType,
  lookup,
} from "https://deno.land/x/media_types@v2.11.0/mod.ts";
import { marked } from "https://ga.jspm.io/npm:marked@4.0.5/lib/marked.esm.js";
import {
  Helmet,
  jsx,
  renderSSR,
} from "https://ga.jspm.io/npm:nano-jsx@0.0.25/lib/index.js";

import Package from "./components/package.js";
//import { removeSlashes } from "./functions/remove-slash.js";

const assetMap = {
  "/": "./index.html",
  "/dom/main.js": "./dom/main.js",
  "/functions/main.js": "./functions/main.js",
  "/functions/remove-slash.js": "./functions/remove-slash.js",
  "/packages": "./packages.html",
  "/packages/[package]": "./package.html",
  "/packages/[package]/css/style.css": "./css/style.css",
  "/packages/[package]/dom/main.js": "./dom/main.js",
  "/packages/[package]/functions/main.js": "./functions/main.js",
  "/packages/[package]/functions/remove-slash.js":
    "./functions/remove-slash.js",
  "/packages/[package]/components/package.js": "./components/package.js",
};

async function customFetch(url, options) {
  const response = await fetch(url, options);
  if (response.status === 404 || response.status === 500) {
    throw new Error(`fetch error on ${url}`);
  }
  return response;
}

async function requestHandler(request) {
  try {
    // const [pathPrefix, packageName] = removeSlashes(pathname).split("/");
    const { pathname } = new URL(request.url);
    if (pathname.startsWith("/package/")) {
      const packageName = pathname.substring(9);

      if (packageName) {
        const NPM_PROVIDER_URL = "https://ga.jspm.io/npm:";
        const baseURL = `${NPM_PROVIDER_URL}${packageName}`;
        const jspmPackage = await fetch(
          `${baseURL}/package.json`,
        );
        const readmeFilesToFetch = ["README.md", "readme.md"];

        const readmeResponse = await Promise.any(
          readmeFilesToFetch.map((file) =>
            customFetch(
              `${baseURL}/${file}`,
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
      }
    }

    return new Response("404", {
      headers: { "content-type": contentType("html") },
    });
  } catch (error) {
    return new Response(error.message || error.toString(), { status: 500 });
  }
}

if (import.meta?.main) {
  const timestamp = Date.now();
  const humanReadableDateTime = new Date(timestamp).toLocaleString();

  console.log("Current Date: ", humanReadableDateTime);
  console.info(`Server Listening on http://localhost:8000`);

  await serve(requestHandler);
}
