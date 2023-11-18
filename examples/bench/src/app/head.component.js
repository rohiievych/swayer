export default {
  tag: 'head',
  children: [
    {
      tag: 'title',
      text: 'Swayer',
    },
    {
      tag: 'link',
      attrs: {
        rel: 'icon',
        type: 'image/png',
        href: 'assets/favicon.png',
      },
    },
    {
      tag: 'link',
      attrs: {
        rel: 'stylesheet',
        href: 'assets/css/currentStyle.css',
      },
    },
    {
      tag: 'meta',
      attrs: {
        charset: 'utf-8',
      },
    },
    {
      tag: 'meta',
      attrs: {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1.0',
      },
    },
  ],
};
