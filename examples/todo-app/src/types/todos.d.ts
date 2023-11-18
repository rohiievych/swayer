interface TodoState {
  title: string;
  editing?: boolean;
  completed?: boolean;
}

interface ITodoModel extends Model<TodoState> {
  state: TodoState;
  updateTitle(title: string): void;
  startEditing(): void;
  endEditing(): void;
  toggleComplete(): void;
}

interface TodosState {
  show: boolean;
  todos: TodoState[];
  counts: {
    completed: number;
    remaining: number;
  },
}

interface ITodosModel extends Model<TodosState> {
  state: TodosState;
  addTodo(title: string): void;
  removeTodo(index: number): void;
  clearCompleted(): void;
  calculateCounts(): void;
  save(): void;
}
