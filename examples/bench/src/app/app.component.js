import AppModel from './app.model.js';

const createActionBtn = (action, text) => ({
  tag: 'div',
  classes: 'col-sm-6 smallpad',
  children: [
    {
      tag: 'button',
      text,
      classes: 'btn btn-primary btn-block',
      attrs: { id: action.toLowerCase() },
      events: {
        click() {
          this.model[action]();
        },
      },
    },
  ],
});

const createRow = (item) => ({
  tag: 'tr',
  classes: ({ selected }) => item.id === selected && 'danger',
  children: [
    {
      tag: 'td',
      classes: 'col-md-1',
      text: item.id,
    },
    {
      tag: 'td',
      classes: 'col-md-4',
      children: [
        {
          tag: 'a',
          attrs: { href: '#' },
          text: () => item.label,
          events: {
            click(event) {
              event.preventDefault();
              this.model.select(item);
            },
          },
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
          events: {
            click(event) {
              event.preventDefault();
              this.model.delete(item);
            },
          },
          children: [
            {
              tag: 'span',
              classes: 'glyphicon glyphicon-remove',
              attrs: { 'aria-hidden': true },
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
});

// KIND OF CONCEPT ??
// const row = {
//   tag: 'tr',
//   classes: {
//     danger: '$selected',
//   },
//   children: [
//     {
//       tag: 'td',
//       classes: 'col-md-1',
//       text: '$id',
//     },
//     {
//       tag: 'td',
//       classes: 'col-md-4',
//       children: [
//         {
//           tag: 'a',
//           attrs: { href: '#' },
//           text: '$label',
//           events: {
//             click: '$select($)',
//           },
//         },
//       ],
//     },
//     {
//       tag: 'td',
//       classes: 'col-md-1',
//       children: [
//         {
//           tag: 'a',
//           attrs: { href: '#' },
//           events: {
//             click: '$delete($)',
//           },
//           children: [
//             {
//               tag: 'span',
//               classes: 'glyphicon glyphicon-remove',
//               attrs: { 'aria-hidden': true },
//             },
//           ],
//         },
//       ],
//     },
//     {
//       tag: 'td',
//       classes: 'col-md-6',
//     },
//   ],
// };




export default {
  tag: 'div',
  classes: 'container',
  model: new AppModel(),
  children: [
    // todo use emmet to shorten desc
    // {
    //   tag: 'div.jumbotron',
    //   children: [
    //     {
    //       tag: 'div.row',
    //       children: [
    //         {
    //           tag: 'div.col-md-6',
    //           children: [
    //             {
    //               tag: 'h1>Swayer unkeyed',
    //             },
    //           ],
    //         },
    //       ],
    //     },
    //   ],
    // },

    {
      tag: 'div',
      classes: 'jumbotron',
      children: [
        {
          tag: 'div',
          classes: 'row',
          children: [
            {
              tag: 'div',
              classes: 'col-md-6',
              children: [
                {
                  tag: 'h1',
                  text: 'Swayer unkeyed',
                },
              ],
            },
            {
              tag: 'div',
              classes: 'col-md-6',
              children: [
                createActionBtn('run', 'Create 1,000 rows'),
                createActionBtn('runLots', 'Create 10,000 rows'),
                createActionBtn('add', 'Append 1,000 rows'),
                createActionBtn('update', 'Update every 10th row'),
                createActionBtn('clear', 'Clear'),
                createActionBtn('swapRows', 'Swap Rows'),
              ],
            },
          ],
        },
      ],
    },
    {
      tag: 'table',
      classes: 'table table-hover table-striped test-data',
      children: [
        {
          tag: 'tbody',
          children: ({ data }) => data.map(createRow),
          // KIND OF CONCEPT OF LOOP ??
          // children: { $data: row },
        },
      ],
    },
    {
      tag: 'span',
      classes: 'preloadicon glyphicon glyphicon-remove',
      attrs: { 'aria-hidden': true },
    },
  ],
};
