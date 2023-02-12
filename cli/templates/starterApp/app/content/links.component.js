/** @type {Styles} */
const linkStyles = {
  display: 'flex',
  backgroundColor: 'white',
  padding: '10px',
  boxShadow: '0 0 5px 0 #bababa',
  borderRadius: '5px',
  textDecoration: 'none',
  color: '#2d2c2c',
  transition: 'all 0.15s ease',
  // Swayer extends CSS props with some functionality,
  // so this code will be rendered to the rule
  // .swr-class:not(:last-child) { margin-right: 20px; }
  not: {
    arg: ':last-child',
    rule: {
      marginRight: '20px',
    },
  },
  // Analogically, this code will be rendered to the rule
  // .swr-class:hover { background-color: #bfefff; ... }
  hover: {
    backgroundColor: '#bfefff',
    color: '#0c5963',
    boxShadow: '0px 0px 7px 2px rgb(103 183 220)',
  },
};

// To parameterize and share schemas use simple functions like the following,
// such code can be also placed in another file to make a component more concise

/** @returns {Schema} */
const createTextLink = ({ text, url }) => ({
  tag: 'a',
  styles: linkStyles,
  text,
  attrs: {
    href: url,
    target: '_blank',
  },
});

/** @returns {Schema} */
const createIconLink = ({ icon, url }) => ({
  tag: 'a',
  styles: linkStyles,
  attrs: {
    href: url,
    target: '_blank',
  },
  children: [
    {
      tag: 'img',
      attrs: { src: icon },
      styles: { width: '30px' },
    },
  ],
});

/** @returns {Schema} */
const createLinks = (links) => ({
  tag: 'div',
  styles: {
    display: 'flex',
    justifyContent: 'center',
    margin: '20px auto 0',
    width: '350px',
  },
  children: links,
});

// Here is schema factory exported,
// which is needed for input consumption by the component,
// so that you can parameterize your component

/** @returns {Schema[]} */
export default (linksData) => {
  const has = (prop) => (link) => Object.hasOwnProperty.call(link, prop);
  const textLinks = linksData.filter(has('text')).map(createTextLink);
  const iconLinks = linksData.filter(has('icon')).map(createIconLink);

  // Component can be also exported as an array in case if
  // it is a fragment without the root element schema
  return [
    createLinks(textLinks),
    createLinks(iconLinks),
  ];
};
