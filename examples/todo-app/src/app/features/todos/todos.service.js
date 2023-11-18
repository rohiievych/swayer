import Storage from '../../utils/storage.js';

class TodosService {
  #storage = new Storage('swayer-todos');

  getTodo(index) {
    const todos = this.#storage.retrieve();
    return todos[index];
  }

  getAllTodos() {
    return this.#storage.retrieve();
  }

  saveAllTodos(todos) {
    this.#storage.save(todos);
  }
}

export default new TodosService();
