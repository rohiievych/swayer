import todosService from '../../todos.service.js';
import { backToListBtnStyles } from './todo.styles.js';

/** @returns {Schema} */
const createDetailBlock = (title, subtitle) => ({
  tag: 'div',
  styles: { padding: '20px 0' },
  children: [
    { tag: 'h4', styles: { margin: 0 }, text: title },
    { tag: 'p', styles: { margin: '10px 0 0' }, text: subtitle },
  ],
});

/** @returns {Schema} */
export default ({ index }) => {
  const {
    title = 'No such todo',
    completed,
  } = todosService.getTodo(index) || {};

  return {
    tag: 'main',
    styles: {
      textAlign: 'center',
    },
    children: [
      {
        tag: 'h2',
        text: `Hey, this is todo number ${index + 1}`,
      },
      createDetailBlock(`What should be done?`, title),
      createDetailBlock('Is it completed?', completed ? 'Yes' : 'No'),
      {
        tag: 'div',
        styles: { marginTop: '30px' },
        children: [
          {
            tag: 'button',
            text: 'Go back to list',
            styles: backToListBtnStyles,
            events: {
              click() {
                this.router.go('/');
              },
            },
          },
        ],
      },
    ],
  };
};
