import { Fragment, jsx } from "nano-jsx";

function Package({ name, description, keywords, version }) {
  return jsx`
    <${Fragment}>
    <h1>${name}</h1>
    <h2>${version}</h2>
    <h3>${description}</h3>
    </${Fragment}>`;
}

export default Package;
