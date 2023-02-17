const bodyStyles = {
  font: `14px 'Helvetica Neue', Helvetica, Arial, sans-serif`,
  lineHeight: '1.4em',
  background: '#f5f5f5',
  color: '#111111',
  minWidth: '230px',
  maxWidth: '550px',
  margin: '0 auto',
  fontWeight: '300',
};

/** @returns {[ComponentRef, Schema]} */
const createPage = (title, contentSchema) => [
  {
    path: '@site/head.component',
    input: title,
  },
  {
    tag: 'body',
    styles: bodyStyles,
    children: [
      contentSchema,
      { path: '@site/footer.component' },
    ],
  },
];

/** @returns {Schema} */
export default ({ locale }) => {
  console.time('Ready');
  return {
    tag: 'html',
    styles: {
      fontFamily: 'Helvetica',
    },
    attrs: { lang: locale },
    hooks: {
      ready() {
        console.timeEnd('Ready');
      },
    },
    children: [
      {
        routes: [
          {
            pattern: '',
            schema: createPage(
              'Todos',
              [
                { path: '@site/header.component' },
                { path: '@todos/container.component' },
              ],
            ),
          },
          {
            pattern: [':id', 'todos/:id'],
            schema: (params) => createPage(
              `Todo #${params.id}`,
              {
                path: '@todo/todo-details.component',
                input: { index: +params.id - 1 },
              },
            ),
          },
          {
            pattern: '**',
            schema: createPage(
              '404',
              {
                tag: 'h2',
                styles: { textAlign: 'center' },
                text: 'Page not found',
              },
            ),
          },
        ],
      },
    ],
  };
};
