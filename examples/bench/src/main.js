export default [
  {
    tag: 'html',
    attrs: { lang: 'en' },
    children: [
      { path: 'app/head.component' },
      {
        tag: 'body',
        children: [
          { path: 'app/app.component' },
        ],
      },
    ],
  },
];
