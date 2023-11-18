/** @implements {ITextModel} */
class TextModel {
  #defaultText = 'I am truly reactive!';
  state = {
    text: this.#defaultText,
  };

  update(text) {
    this.state.text = text || this.#defaultText;
  }
}

/** @type {Styles} */
const inputStyles = {
  padding: '8px 14px',
  fontSize: '14px',
  borderRadius: '5px',
  outline: 'none',
  border: 'none',
  boxShadow: '0 0 5px 0 #bababa',
  transition: 'box-shadow 0.1s ease',
  compute: ({ text }) => ({
    boxShadow: `0 0 ${text.length}px 0 #bababa`,
  }),
};

/** @type {Schema<ITextModel>} */
export default {
  tag: 'div',
  styles: { marginTop: '40px' },
  model: new TextModel(),
  classes: ({ text }) => text,
  children: [
    {
      tag: 'input',
      styles: inputStyles,
      attrs: { type: 'text', placeholder: 'Type something here...' },
      events: {
        input(event) {
          const value = event.target.value;
          this.model.update(value);
        },
      },
    },
    {
      tag: 'p',
      styles: { fontWeight: 600 },
      text: (state) => state.text,
    },
  ],
};
