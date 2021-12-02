import { render, jsx } from 'nano-jsx';
import Package from '../components/package.js';

async function main({ mountDOMElement, packageName }) {
  try {
    const { default: data } = await import(`/api/${packageName}`, {
      assert: { type: "json" },
    });
    
    const { name, description, keywords, version } = data;
    render(jsx`<${Package} name=${name} description=${description} version=${version} />`, mountDOMElement)
  } catch (error) {
    console.error(error);
  }
}

export { main };
