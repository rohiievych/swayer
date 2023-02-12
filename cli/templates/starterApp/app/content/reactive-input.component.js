// The class below contains a state and mutations on it,
// state is a reactive data object, so put there only data,
// which will be used in component reactions

/** @implements {Model} */
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
  // This is the special style reaction, which recalculates
  // a piece of CSS props on each state.text.length change,
  // don't update state in reactions as will cause a call stack overflow,
  // only reads are allowed
  compute: (state) => ({
    boxShadow: `0 0 ${state.text.length}px 0 #bababa`,
  }),
};

/** @type {Schema} */
export default {
  tag: 'div',
  styles: { marginTop: '40px' },
  // Here is the component TextModel attached, so that it can be used
  // across all it's underlying element schemas,
  // the model is scoped to the component or element schema,
  // which will override the component's one
  model: new TextModel(),
  children: [
    {
      tag: 'input',
      styles: inputStyles,
      attrs: { type: 'text', placeholder: 'Type something here...' },
      // This object is used to create event listeners with event names
      // like click, mouseover, keyup and other system events,
      // custom event listeners are also possible,
      // the engine passes a native event as a parameter to these methods
      events: {
        input() {
          // Get the input value property
          const value = this.props.value;
          // Update the TextModel
          this.model.update(value);
        },
      },
    },
    {
      tag: 'p',
      styles: { fontWeight: 600 },
      // This reaction will be triggered automatically on each input update,
      // this is the way how we bind state to the view,
      // this reaction is only an example, so you can bind state on
      // text, attrs, styles, children, props and even events
      text: (state) => state.text,
    },
  ],
};
