// Here must be exported the root schema,
// which is the entry point for the app

// Type your schemas to make sure it is checked with TypeScript

/** @type {Schema} */
export default {
  // Namespaces are basically used for component referencing
  namespaces: {
    '@app': 'app',
    '@content': 'app/content',
  },
  children: [
    // The reference to page component containing root html element
    { path: '@app/page.component' },
  ],
};
