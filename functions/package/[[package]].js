import { Helmet, jsx, renderSSR } from "nano-jsx";
import { marked } from "marked";
import Package from "../../components/package.js";

async function fetchAndCache(url, waitUntil){
  const cacheUrl = new URL(url)

  // Construct the cache key from the cache URL
  const cacheKey = new Request(cacheUrl.toString())
  const cache = caches.default

  // Check whether the value is already available in the cache
  // if not, you will need to fetch it from origin, and store it in the cache
  // for future access
  let response = await cache.match(cacheKey)

  if (!response) {
    // If not in cache, get it from origin
    response = await fetch(url)

    // Must use Response constructor to inherit all of response's fields
    response = new Response(response.body, response)

    // Cache API respects Cache-Control headers. Setting s-max-age to 10
    // will limit the response to be in cache for 10 seconds max

    // Any changes made to the response here will be reflected in the cached value
    // response.headers.append("Cache-Control", "s-maxage=10")

    // Store the fetched response as cacheKey
    // Use waitUntil so you can return the response without blocking on
    // writing to cache
    waitUntil(cache.put(cacheKey, response.clone()))
  }
  return response
}

async function onRequestGet({ params, waitUntil }) {
  const NPM_PROVIDER_URL = "https://ga.jspm.io/npm:";
  const packageName = params.package.join("/");

  const jspmPackage = await fetchAndCache(
    `${NPM_PROVIDER_URL}${packageName}/package.json`,
    waitUntil
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
  
  const readmeFileNames = ["readme.md", "README.md"]
  const readmeFile = await Promise.any(readmeFileNames.map(readmeFileName => fetchAndCache(
    `${NPM_PROVIDER_URL}${packageName}/${readmeFileName}`,
    waitUntil
  )));
  const readmeFileContent = await readmeFile.text();
  const readmeHTML = marked.parse(readmeFileContent);
  const app = renderSSR(
    jsx
      `<${Package} name=${name} description=${description} version=${version} homepage=${homepage} license=${license} files=${files} exports=${exports} readme=${readmeHTML} />`,
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
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
    headers: { "content-type": "text/html; charset=UTF-8" },
  });
}

export { onRequestGet };
