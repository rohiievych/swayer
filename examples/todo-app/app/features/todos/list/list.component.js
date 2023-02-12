import { todoListStyles } from './list.styles.js';

/** @returns {Schema<ITodosModel>} */
export default (todosModel) => ({
  tag: 'ul',
  model: todosModel,
  styles: todoListStyles,
  events: {
    toggleComplete() {
      this.model.calculateCounts();
    },
    removeTodo({ detail: index }) {
      this.model.removeTodo(index);
    },
    todoChange() {
      this.model.save();
    },
  },
  children: ({ todos }) => todos.map((todo, index) => ({
    path: '@todos/list/todo/todo.component',
    input: { todo, index },
  })),
});
