const adjectives = [
    'pretty', 'large', 'big', 'small', 'tall', 'short', 'long', 'handsome',
    'plain', 'quaint', 'clean', 'elegant', 'easy', 'angry', 'crazy', 'helpful',
    'mushy', 'odd', 'unsightly', 'adorable', 'important', 'inexpensive',
    'cheap', 'expensive', 'fancy',
  ];
  const colors = [
    'red', 'yellow', 'blue', 'green', 'pink', 'brown', 'purple', 'brown',
    'white', 'black', 'orange',
  ];
  const nouns = [
    'table', 'chair', 'house', 'bbq', 'desk', 'car', 'pony',
    'cookie', 'sandwich', 'burger', 'pizza', 'mouse', 'keyboard',
  ];

  export default class AppModel {
    static id = 0;

    state = {
      data: [],
      selected: null,
    };

    #buildData(count) {
      const data = [];
      while (data.length < count) {
        const adjective = adjectives[this.#random(adjectives.length)];
        const color = colors[this.#random(colors.length)];
        const noun = nouns[this.#random(nouns.length)];
        data.push({
          id: AppModel.id++,
          label: `${adjective} ${color} ${noun}`,
        });
      }
      return data;
    }

    #random(max) {
      return Math.round(Math.random() * 1000) % max;
    }

    select(item) {
      this.selected = item.id;
    }

    delete(item) {
      const index = this.state.data.findIndex(({ id }) => id === item.id);
      this.state.data.splice(index, 1);
    }

    run() {
      this.state.data = this.#buildData(1000);
    }

    add() {
      const data = this.#buildData(1000);
      this.state.data = this.state.data.concat(data);
    }

    update() {
      const len = this.state.data.length;
      for (let i = 0; i < len; i += 10) {
        this.state.data[i].label += ' !!!';
      }
    }

    runLots() {
      this.state.data = this.#buildData(10000);
      this.selected = null;
    }

    clear() {
      this.state.data = [];
      this.selected = null;
    }

    swapRows() {
      if (this.state.data.length > 998) {
        // not working updating index
        // const a = this.state.data[1];
        // this.state.data[1] = this.state.data[998];
        // this.state.data[998] = a;

        const data = this.state.data;
        this.state.data = [data[0], data[998], ...data.slice(2, 998), data[1], data[999]];
      }
    }
  }
