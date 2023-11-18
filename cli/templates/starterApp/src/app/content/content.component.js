const contentData = {
  title: 'Welcome to Swayer starter app!',
  subtitle: 'Learn how to develop with Swayer',
  links: [
    {
      text: 'Read documentation',
      url: 'https://github.com/rohiievych/swayer#swayer-documentation',
    },
    {
      text: 'Play with example',
      url: 'https://github.com/rohiievych/swayer/tree/main/examples/todo-app',
    },
    {
      icon: 'assets/icons/github.png',
      url: 'https://github.com/rohiievych/swayer',
    },
    {
      icon: 'assets/icons/patreon.png',
      url: 'https://patreon.com/rohiievych',
    },
  ],
};

/** @type {Styles} */
const mainStyles = {
  margin: '100px auto',
  padding: '25px',
  maxWidth: '600px',
  backgroundColor: '#c7ffc7',
  borderRadius: '10px',
  border: '1px solid #82da82',
  boxShadow: '0px 5px 20px 0px rgba(0, 0, 0, 0.3)',
};

/** @type {Schema} */
export default {
  tag: 'main',
  styles: mainStyles,
  children: [
    {
      tag: 'h1',
      styles: { margin: 0 },
      // Text property is used to create a text node in the element
      text: contentData.title,
    },
    {
      tag: 'p',
      styles: { lineHeight: '32px' },
      text: contentData.subtitle,
    },
    // You can also pass input value to the referenced
    // component
    {
      path: '@content/links.component',
      input: contentData.links,
    },
    {
      path: '@content/reactive-input.component',
    },
  ],
};
