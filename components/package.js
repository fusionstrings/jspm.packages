import {
  Fragment,
  jsx,
} from "https://ga.jspm.io/npm:nano-jsx@0.0.25/lib/index.js";
function Package(
  {
    name,
    description,
    keywords,
    version,
    homepage,
    license,
    files,
    exports,
    readme,
  },
) {
  return jsx`
    <${Fragment}>
    <jspm-package-name><a href=${homepage}>${name}</a></jspm-package-name>
    <jspm-package-version>${version}</jspm-package-version>
    <jspm-package-description>${description}</jspm-package-description>
    <jspm-package-readme dangerouslySetInnerHTML=${{
    __html: readme,
  }} />
    <aside>
      <jspm-package-license>${license}</jspm-package-license>

      <jspm-package-files>
        ${
    files?.map((file) => (
      jsx`<jspm-package-file>${file}</jspm-package-file>`
    ))
  }
      </jspm-package-files>
    </aside>
  
    </${Fragment}>`;
}

export default Package;
