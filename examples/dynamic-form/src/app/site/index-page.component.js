import patientService from './patient-service.js';

const buttonStyles = {
  padding: '5px 10px',
  margin: '20px',
  borderRadius: '5px',
  backgroundColor: 'purple',
  border: 'none',
  color: 'white',
  cursor: 'pointer',
  transition: 'background-color 0.2s ease-in-out',
  hover: {
    backgroundColor: 'rebeccapurple',
  },
};

/** @type {Schema} */
const addFormButton = {
  tag: 'button',
  styles: buttonStyles,
  text: 'Load new form',
  attrs: {
    type: 'button',
  },
  events: {
    async click() {
      const diseaseFormData = await patientService.getDiseaseFormData();
      this.model.addForm(diseaseFormData);
    },
  },
};

/** @type {Schema} */
const removeFormButton = {
  tag: 'button',
  text: 'Remove last form',
  styles: buttonStyles,
  attrs: {
    type: 'button',
  },
  events: {
    click() {
      this.model.popForm();
    },
  },
};

class FormsSchemaModel {
  state = {
    forms: new Array(2).fill(null).map(() => ({
        action: 'addPatientDisease',
        title: 'Disease form',
        fields: {
          disease: {
            type: 'text',
            defaultValue: '',
            placeholder: 'Name',
          },
          symptom: {
            type: 'select',
            defaultValue: 'soreThroat',
            options: [
              { text: 'Sore throat', value: 'soreThroat' },
              { text: 'Stomach ache', value: 'stomachAche' },
              { text: 'Tooth pain', value: 'toothPain' },
            ],
          },
        },
      }),
    ),
  };

  addForm(data) {
    this.state.forms.push(data);
  }

  popForm() {
    this.state.forms.pop();
  }
}

const simpleComponent = {
  tag: 'span',
  text: 'I am very simple',
};

class Component {
  static schema = {
    tag: 'div',
    styles: { marginTop: '40px' },
    children: [
      {
        tag: 'input',
        styles: {
          padding: '8px 14px',
          fontSize: '14px',
          borderRadius: '5px',
          outline: 'none',
          border: 'none',
          boxShadow: '0 0 5px 0 #bababa',
          transition: 'box-shadow 0.1s ease',
        },
        attrs: { type: 'text', placeholder: 'Type something here...' },
        events: {
          input() {
            const value = this.props.value;
            this.updateText(value);
          },
        },
      },
      {
        tag: 'p',
        styles: { fontWeight: 600 },
        text: ({ text }) => text,
      },
    ],
  };

  text = '';

  constructor(input) {
    this.text = input;
  }

  updateText(text) {
    this.text = text;
  }
}

const template = `
  div
    header
      h1 ${({ text }) => text} ${{
        click() {

        },
      }}
    section
      p ${'Some Text'}
    footer
      p ${{ attr: 'ok' }}
`;

const simpleComponent2 = {
  // If model resolves an object, then instantiate a single node,
  // then bind state to reactions
  model: (input) => ({ state: { text: input.text } }),
  schema: [
    {
      tag: 'p',
      text: ({ text }) => text,
    },
    simpleComponent,
  ],
};

const formComponent = {
  // If model resolves an array, then populate schema
  model: ({ forms }) => forms,
  schema: {
    tag: 'form',
    children: [
      {
        tag: 'input',
        attrs: { name: ({ name }) => name },
      },
      simpleComponent2,
    ],
  },
};

const component = {
  // If model resolves a class, then instantiate it as a function
  model: FormsSchemaModel,
  schema: {
    tag: 'html',
    styles: { fontFamily: 'Helvetica' },
    attrs: { lang: 'en' },
    children: [
      { path: '@site/head.component' },
      {
        tag: 'body',
        styles: { margin: 0 },
        children: [
          ({ forms }) => ({
            input: forms,
            path: '@form/form',
          }),
          formComponent,
          addFormButton,
          ({ forms }) => (forms.length > 0) && removeFormButton,
        ],
      },
    ],
  },
};

/** @returns {Schema} */
export default () => ({
  tag: 'html',
  styles: {
    fontFamily: 'Helvetica',
  },
  model: new FormsSchemaModel(),
  attrs: {
    lang: 'en',
  },
  children: [
    { path: '@site/head.component' },
    {
      tag: 'body',
      styles: {
        margin: '0',
      },
      children: [
        // TODO optimize by [predicate, array] ?
        ({ forms }) => forms.map((form) => ({
          path: '@form/form',
          input: form,
        })),
        addFormButton,
        ({ forms }) => (forms.length > 0) && removeFormButton,
      ],
    },
  ],
});
