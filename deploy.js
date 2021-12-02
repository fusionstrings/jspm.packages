// currently copy of server.js with Deno.readFile instead of fetch
import { serve } from "https://deno.land/std@0.116.0/http/server.ts";
import { contentType, lookup } from "https://deno.land/x/media_types@v2.11.0/mod.ts";
// import { removeSlashes } from "./functions/remove-slash.js";

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
  "/packages/[package]/functions/remove-slash.js": "./functions/remove-slash.js",
  "/packages/[package]/components/package.js": "./components/package.js",
};

async function requestHandler(request) {
  try {
    const site = request.headers.get("sec-fetch-site");
    if (site !== "same-origin") {
      // 👻
    }
    const mode = request.headers.get("sec-fetch-mode");
    const dest = request.headers.get("sec-fetch-dest");

    const { pathname } = new URL(request.url);

    const staticAsset = assetMap[pathname];

    if (staticAsset) {
      const response = await Deno.readFile(staticAsset);

      return new Response(response, {
        headers: { "content-type": contentType(lookup(staticAsset)) },
      });
    }

    // const [pathPrefix, packageName] = removeSlashes(pathname).split("/");

    if (pathname.startsWith("/packages/")) {
      const packageName = pathname.substring(10);

      if (packageName) {
        if (mode === "navigate" || dest === "document") {
          const response = await Deno.readFile(assetMap["/packages/[package]"])

          return new Response(response, {
            headers: { "content-type": contentType("html") },
          });
        }

        if (dest === "style") {
          const [, cssFilePath] = packageName.split('css/');
          const response = await Deno.readFile(assetMap[`/packages/[package]/css/${cssFilePath}`]);

          return new Response(response, {
            headers: { "content-type": contentType("css") },
          });
        }

        if (dest === "script") {
          const jsContexts = ['functions/', 'components/', 'dom/'];
          const jsContext = jsContexts.find(jsContext =>  packageName.includes(jsContext));

          if(jsContext){
            const [, jsFilePath] = packageName.split(jsContext)
            const response = await Deno.readFile(assetMap[`/packages/[package]/${jsContext}${jsFilePath}`]);
  
            return new Response(response, {
              headers: { "content-type": contentType("js") },
            });
          }
        }
      }
    }

    if (pathname.startsWith("/api/")) {
      const packageName = pathname.substring(5);
      const NPM_PROVIDER_URL = "https://ga.jspm.io/npm:";

      let version =  packageName.split("@")[packageName.startsWith('@') ? 2 : 1];

      if (!version) {
        const response = await fetch(`${NPM_PROVIDER_URL}${packageName}`);
        version = await response.text();
      }

      return fetch(`${NPM_PROVIDER_URL}${packageName}@${version}/package.json`);
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
