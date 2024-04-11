import { render } from '../../lib-v2/renderer.js';

const div = {
  tag: 'div',
  children: [
    { tag: 'p', text: 'I am p element 1' },
    'I am span 1',
    'I am span 1.1',
    'I am span 1.2',
    '',
    '',
    {
      tag: 'p',
      children: [
        {
          tag: 'span',
          children: [
            { tag: 'span', text: 'I am inner span 1' },
            { tag: 'p', text: 'I am inner span 2' },
            'I am text 1',
          ],
        },
        // { tag: 'p', text: 'I am inner span 2' },
      ],
    },
  ],
};

const div2 = {
  tag: 'div',
  children: [
    { tag: 'p', text: 'I am p element 1' },
    'I am span 1',
    // { tag: 'p', text: 'I am p element 2' },
    {
      tag: 'p',
      children: [
        'aaa',
        // { tag: 'p', text: 'I am inner span 2' },
        // undefined,
        null,
      ],
    },
  ],
};

const r1 = {
  tag: 'tr',
  attrs: {
    test: 1,
  },
  children: [
    {
      tag: 'td',
      classes: 'td-123',
      text: 'I am r1',
    },
  ],
};

const r2 = [
  {
    tag: 'tr',
    children: [
      {
        tag: 'td',
        text: 'I am r2 frag',
      },
    ],
  },
  {
    tag: 'tr',
    children: [
      {
        tag: 'td',
        text: 'I am r2 frag',
      },
    ],
  },
];

const actionBtn = {
  tag: 'button',
  text: (state) => state.text,
};

const example = {
  tag: 'table',
  attrs: () => ({ id: 'example-1' }),
  classes: 'table table-hover table-striped test-data',
  children: [
    {
      tag: 'tbody',
      // children: ({ data, row }) => row === 'row1' ? r1 : r2,
      children: ({ data, row }) => ({
        schema: [row === 'row1' ? div : div2, { tag: 'hr' }],
        // schema: row === 'row1' ? fragRow : fragRow[0],
        of: data,
        // of: row === 'row1' ? data.slice(0, 10) : data.slice(0, 5),
      }),

      // children: (state) => ({
      //   schema: actionBtn,
      //   args: { action: 'run', text: 'Create 1,000 rows' },
      // }),
    },
  ],
};

const fragRow = [
  {
    tag: 'tr',
    children: [
      {
        tag: 'td',
        // attrs: {
        //   test: 1,
        // },
        text: ({ id }) => id,
        // children: () => ({
        //   schema: {
        //     tag: 'p',
        //     text: 'Para',
        //   },
        //   of: [{ data: 'abc' }, { data: 'abc' }],
        // }),
      },
    ],
  },
  {
    tag: 'tr',
    children: [
      {
        tag: 'td',
        text: ({ label }) => label,
      },
    ],
  },
  {
    tag: 'tr',
    children: [
      {
        tag: 'td',
        text: ({ label }) => label,
      },
    ],
  },
];

const fragRow2 = [
  {
    tag: 'tr',
    children: [
      {
        tag: 'td',
        text: 'Name',
      },
    ],
  },
  {
    tag: 'tr',
    children: [
      {
        tag: 'td',
        text: ({ label }) => label,
      },
    ],
  },
  {
    tag: 'tr',
    children: [
      {
        tag: 'td',
        text: ({ label }) => label,
      },
    ],
  },
];

const row2 = {
  tag: 'tr',
  children: [
    {
      tag: 'td',
      attrs: { class: () => 'col-md-1' },
      text: 'Col 1',
    },
    {
      tag: 'td',
      attrs: { class: () => 'col-md-2' },
      text: () => 'Col 2',
    },
  ],
};

const row1 = {
  tag: 'tr',
  children: [
    {
      tag: 'td',
      classes: 'col-md-1',
      attrs: { class: () => 'col-md-1' },
      text: (state) => state.id,
    },
    {
      tag: 'td',
      classes: 'col-md-4',
      children: [
        {
          tag: 'a',
          attrs: { href: '#' },
          text: (state) => state.label,
        },
      ],
    },
    {
      tag: 'td',
      classes: 'col-md-1',
      children: [
        {
          tag: 'a',
          attrs: { href: '#' },
          children: [
            {
              tag: 'span',
              classes: 'glyphicon glyphicon-remove',
              attrs: { 'aria-hidden': true },
              text: 'This is span',
            },
          ],
        },
      ],
    },
    {
      tag: 'td',
      classes: 'col-md-6',
    },
  ],
};

const frag = [
  {
    tag: 'h4',
    text: (state) => state.name,
  },
  {
    tag: 'p',
    text: (state) => state.description,
  },
];

const example2 = {
  tag: 'main',
  attrs: () => ({ id: 'example-2' }),
  children: [
    {
      tag: 'section',
      // children: [
      //   {
      //     schema: frag,
      //     of: [
      //       { name: 'Apple', description: 'Green apple' },
      //       { name: 'Pear', description: 'Tasty fruit' },
      //     ],
      //   },
      // ],
      children: [
        {
          tag: 'h3',
          text: 'Before fruits',
        },
        ({ fruits }) => ({
          schema: frag,
          of: fruits,
        }),
        {
          tag: 'h3',
          text: 'After fruits',
        },
        ({ fruits, isUpdate }) => ({
          schema: isUpdate ? frag.concat(frag) : frag,
          of: fruits,
        }),
      ],

      // (state) => ({
      //   schema: actionBtn,
      //   input: { action: 'run', text: 'Create 1,000 rows' },
      // }),
    },
  ],
};

/** @type {any} */
const root = document.getElementById('root');
/** @type {any} */
const createBtn = document.getElementById('create');
/** @type {any} */
const updateBtn = document.getElementById('update');
/** @type {any} */
const deleteBtn = document.getElementById('delete');

const createArray = (num = 1000) => new Array(num).fill(null);
const createItem = (add = 0) => (_, i) => ({
  id: 1 + i + add,
  label: `Item ${1 + i + add}`,
});

const createFn = () => {
  const exampleElement = document.querySelector('#example-1');
  const state = {
    data: createArray().map(createItem()),
    row: exampleElement ? 'row1' : 'row2',
  };
  const resultEl = render(example, state, exampleElement);
  if (!exampleElement) root.append(resultEl);
};

const updateFn = () => {
  const exampleElement2 = document.querySelector('#example-2');
  const state2 = {
    // data: createArray().map(createItem(100)),
    // row: 'row2',
    fruits: [
      { name: 'Apple', description: 'Green apple' },
      { name: 'Pear', description: 'Tasty fruit' },
    ],
    isUpdate: !!exampleElement2,
  };
  const resultEl = render(example2, state2, exampleElement2);
  if (!exampleElement2) root.append(resultEl);
};

const deleteFn = () => {
  const exampleElement = document.querySelector('#example-1');
  const state = { data: [] };
  render(example, state, exampleElement);

  const exampleElement2 = document.querySelector('#example-2');
  const state2 = { fruits: [] };
  render(example2, state2, exampleElement2);
};

createBtn.addEventListener('click', createFn);
updateBtn.addEventListener('click', updateFn);
deleteBtn.addEventListener('click', deleteFn);
