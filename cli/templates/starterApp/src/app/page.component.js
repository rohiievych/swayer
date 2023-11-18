// Consider component as an element schema,
// which is exported with 'export default'

/** @type {Schema} */
export default {
  // Tag corresponds to the valid HTML tag name,
  // use intellisense to see them
  tag: 'html',
  // Put element attributes here
  attrs: { lang: 'en' },
  children: [
    { path: '@app/head.component' },
    {
      tag: 'body',
      // Put styles object here, it can be also defined
      // somewhere in the variable. The engine knows how to
      // distribute these styles, so no need to write CSS selectors,
      // simply write usual CSS props, but in camelCase
      styles: {
        margin: 0,
        fontFamily: 'Helvetica',
        textAlign: 'center',
        color: '#2d2c2c',
      },
      // Children is an array of inner schemas
      children: [
        { path: '@content/content.component' },
      ],
    },
  ],
};
