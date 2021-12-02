import { render, jsx } from 'nano-jsx';
import { marked } from 'marked';
import Package from '../components/package.js';

async function main({ mountDOMElement, packageName }) {
  try {
    const { default: data } = await import(`/api/${packageName}`, {
      assert: { type: "json" },
    });
    
    const { name, description, keywords, version, homepage, license, files, exports } = data;

  // /^readme\.[^\.]+$/i
  const readme = files.find(file => file.toLowerCase() === 'readme.md');
  // Dry this
  const readmeFile = await fetch(`https://ga.jspm.io/npm:${name}@${version}/${readme}`);
  const readmeFileContent = await readmeFile.text();
  const html = marked.parse(readmeFileContent);
    render(jsx`<${Package} name=${name} description=${description} version=${version} homepage=${homepage} license=${license} files=${files} exports=${exports} readme=${html} />`, mountDOMElement)
  } catch (error) {
    console.error(error);
  }
}

export { main };
