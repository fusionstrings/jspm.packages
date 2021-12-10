/// <reference types="@fastly/js-compute" />
import MarkdownIt from "markdown-it";

async function customFetch(url, options) {
  const response = await fetch(url, options);
  if (response.status === 404 || response.status === 500) {
    throw new Error(`fetch error on ${url}`);
  }
  return response;
}

async function handler({ request }) {
  try {
    const backend = "ga_jspm_io";
    const url = new URL(request.url);
    const { pathname } = url;
    if (pathname.startsWith("/package/")) {
      const packageName = pathname.substring(9);

      if (packageName) {
        const NPM_PROVIDER_URL = "https://ga.jspm.io/npm:";
        const baseURL = `${NPM_PROVIDER_URL}${packageName}`;

        const jspmPackage = await fetch(
          `${baseURL}/package.json`,
          {
            backend,
          },
        );

        const readmeFilesToFetch = ["README.md", "readme.md"];

        const readmeResponse = await Promise.any(
          readmeFilesToFetch.map((file) =>
            customFetch(
              `${baseURL}/${file}`,
              { backend },
            )
          ),
        );

        const readmeFileContent = await readmeResponse.text();
        const md = new MarkdownIt();
        const readmeHTML = md.render(readmeFileContent);

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
                </head>
                <body>
                <jspm-package-name><a href=${homepage}>${name}</a></jspm-package-name>
                <jspm-package-version>${version}</jspm-package-version>
                <jspm-package-description>${description}</jspm-package-description>
                ${readmeHTML}
                <aside>
                  <jspm-package-license>${license}</jspm-package-license>

                  <jspm-package-files>
                    ${
                      files?.map((file) => (
                        `<jspm-package-file>${file}</jspm-package-file>`
                      ))
                    }
                  </jspm-package-files>
                </aside>
                </body>
              </html>`;

        return new Response(html, {
          headers: {
            "content-type": "text/html; charset=UTF-8",
          },
        });
      }
    }

    return fetch(request, {
      backend,
    });
  } catch (error) {
    return new Response(error.message || error.toString(), { status: 500 });
  }
}

addEventListener("fetch", (event) => {
  // Send the backend response back to the client.
  return event.respondWith(handler(event));
});
