import { todoInputStyles } from './input.styles.js';

/** @returns {Schema} */
export default (todosModel) => ({
  tag: 'input',
  styles: todoInputStyles,
  model: {
    state: {
      test: 'Initial',
    },
  },
  attrs: {
    test: ({ test }) => test || false,
    autofocus: true,
    placeholder: 'What needs to be done?',
  },
  events: {
    input(event) {
      this.model.state.test = event.target.value;
    },
    keyup(event) {
      const title = event.target.value;
      if (title && event.key === 'Enter') {
        todosModel.addTodo(title);
        this.model.state.test = event.target.value = '';
      }
    },
  },
});
