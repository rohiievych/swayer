import { renderRoot } from '../../lib-v2/renderer.js';

// const page = {
//   tag: 'html',
//   attrs: { lang: 'uk' },
//   children: [
//     {
//       tag: 'head',
//       children: [
//         { tag: 'meta', attrs: { charset: 'utf-8' } },
//         { tag: 'title', text: 'Swayer experiment-v2' },
//       ],
//     },
//     {
//       tag: 'body',
//       children: [
//         createBtn('Create'),
//         createBtn('Update'),
//         createBtn('Delete'),
//       ],
//     },
//   ],
// };

class ModelSample {
  state = {
    /** @type {{ label: string }[]} */
    items: [],
    text: '',
  };

  createList() {
    const items = new Array(1000).fill(null);
    this.state.items = items.map((_, i) => ({ label: `Item ${i + 1}` }));
    this.state.text = 'UPDATED';
  }

  deleteList() {
    this.state.items = [];
  }
}

const li = {
  tag: 'li',
  text: (item) => item.label,
};

const root = {
  tag: 'div',
  model: ModelSample,
  children: [
    {
      tag: 'button',
      attrs: { id: 'create' },
      text: 'Create',
      events: {
        click() {
          this.createList();
        },
      },
    },
    {
      tag: 'button',
      attrs: { id: 'delete' },
      text: 'Delete',
      events: {
        click() {
          this.deleteList();
        },
      },
    },
    {
      tag: 'ul',
      attrs: { id: 'children' },
      children: [
        (state) => state.text,
        ({ items }) => ({
          schema: li,
          of: items,
        }),
      ],
    },
  ],
};

const result = renderRoot(root);
// const result = renderRoot(page);
document.body.append(result);
