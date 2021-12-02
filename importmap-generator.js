import { Generator } from "https://cdn.jsdelivr.net/gh/fusionstrings/dependencies@79747a4a7b62b79c739dce68b36d92fc3d90a8c0/dist/deno/jspm.js";

async function main(subpath = "./js/main.js") {
    const generator = new Generator({
        env: ['production', 'browser'],
    });

    await generator.install([
        {
            alias: "@jspm/packages",
            target: "./",
            subpath,
        },
    ]);
    const importMap = JSON.stringify(generator.getMap(), null, 2);
    return importMap;
}

if (import.meta.main) {
    const importmap = await main();
    console.log('importmap: ', importmap);
}

export { main }