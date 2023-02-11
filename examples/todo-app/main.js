const locales = {
  uk: 'uk',
  en: 'en',
};

/** @returns {ComponentRef} */
const createPageComponent = (locale = locales.uk) => ({
  path: '@site/page.component',
  input: { locale },
});

/** @type {Schema} */
export default {
  namespaces: {
    '@site': 'app/site',
    '@todos': 'app/features/todos',
  },
  preload: [
    '@site/head.component',
    '@site/header.component',
    '@site/footer.component',
    '@todos/container.component',
    '@todos/input/input.component',
    '@todos/list/list.component',
    '@todos/list/todo/todo.component',
    '@todos/counts/counts.component',
  ],
  children: [
    {
      routes: [
        {
          pattern: ['', 'todos'],
          schema: createPageComponent(),
        },
        {
          pattern: [':locale', ':locale/todos'],
          canMatch: (params) => params.locale in locales,
          schema: (params) => createPageComponent(locales[params.locale]),
        },
        {
          pattern: '**',
          schema: createPageComponent(),
        },
      ],
    },
  ],
};
