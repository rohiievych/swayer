// CONCEPT
// model: (input) => { state: input }
//
// text: (state) => state.someText
//
// Messaging
// Define
// const topics = {
//   methodName: {
//     value: 'string', // JSON schemas
//   },
// }

// In model
// this.send(topics.methodName, { value: 'My text' })

class Intercom {
  constructor(config) {}

  // symbol
  deleteRow;

  static create(config) {
    return class {
      deleteRow(index) {}
    };
  }
}

// Variant 1

const listIntercom = new Intercom({
  deleteRow: { params: 'number' },
});

class AnotherModel {
  state = { data: [] };

  [listIntercom.deleteRow](index) {
    this.state.splice(index, 1);
  }
}

// Variant 2

const ListIntercom = Intercom.create({
  deleteRow: { params: 'number' },
});

class RowConsumerModel extends ListIntercom {
  state = { data: [] };

  deleteRow(index) {
    this.state.splice(index, 1);
  }
}

class RowEmitterModel extends ListIntercom {
  state = {};
  index = 0;

  constructor(item, index) {
    super();
    this.state = item;
    this.index = index;
  }

  delete() {
    this.deleteRow(this.index);
  }
}

class RowModel {
  state = {};
  index = 0;

  constructor(item, index) {
    this.state = item;
    this.index = index;
  }

  delete() {
    listIntercom.deleteRow(this.index);
  }
}

const rowTemplate = {
  tag: 'tr',
  params: {
    id: 'number',
    label: 'string',
    selected: 'boolean',
  },
  // Default model factory
  // model: (input, index) => ({ state: input }),
  model: RowModel,
  classes: ({ selected }) => selected && 'danger',
  children: [
    {
      tag: 'td',
      classes: 'col-md-1',
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
          click(event) {
            event.preventDefault();
            this.model.select();
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
          click(event) {
            event.preventDefault();
            this.model.delete();
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
};
