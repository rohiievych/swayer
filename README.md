# Swayer - schema based UI engine

[![npm version](https://img.shields.io/npm/v/swayer)](https://www.npmjs.com/package/swayer)
[![npm downloads/month](https://img.shields.io/npm/dm/swayer.svg)](https://www.npmjs.com/package/swayer)
[![npm downloads](https://img.shields.io/npm/dt/swayer.svg)](https://www.npmjs.com/package/swayer)
[![snyk](https://snyk.io/test/github/metarhia/swayer/badge.svg)](https://snyk.io/test/github/metarhia/swayer)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/metarhia/swayer/blob/main/LICENSE)

**Comprehensive UI engine** for fast and low overhead JavaScript development

## Before we begin

Find your way to help ukrainians defend the world of freedom and democracy:

- Support Ukraine at [United24](https://u24.gov.ua/)
- Support [Ukrainian Armed Forces](https://bank.gov.ua/en/news/all/natsionalniy-bank-vidkriv-spetsrahunok-dlya-zboru-koshtiv-na-potrebi-armiyi)
- Make a donation to [Come Back Alive](https://savelife.in.ua/en/donate-en) charity foundation
- Find more donation targets at [Stand For Ukraine](https://standforukraine.com/)

**Why is this so important?**

My home country has been ruined by terrible war started by Russian Federation. Thousands of people lost their lives and homes. Millions are affected by acts of terrorism, which occur on daily basis. They say they came to protect someone, but instead cruelly kill children and elderly people, erase whole cities from the face of the earth, because they simply don't want Ukraine to exist. This is insane to have such reality in the 21st century, so we must stop the global evil from expanding. Arm Ukraine - give this world a chance!

**This technological product is prohibited for use by citizens of #RussiaIsATerroristState.**

## Quick start

Install Swayer CLI

```shell
npm i -g swayer
```

Create starter project with Swayer CLI

```shell
swr create mySwayerProject && cd mySwayerProject
```

Start application

```shell
npm start
```

## Showcase

- See
  online [Todo Application demo](https://metarhia.github.io/swayer/examples/todo-app/)
- Play with [example](https://github.com/metarhia/swayer/tree/main/examples/todo-app) code to
  investigate how it works

## Contacts

Telegram:

- Swayer UA community:
  - channel: [SwayerUA](https://t.me/SwayerUA)
  - chat: [SwayerUAChat](https://t.me/SwayerUAChat)


- Swayer EN community:
  - channel: [SwayerEN](https://t.me/SwayerEN)
  - chat: [SwayerENChat](https://t.me/SwayerENChat)

E-mail: [roman@swayer.dev](mailto:roman@swayer.dev)

## Description

Swayer is a comprehensive user interface engine, which enables pure **JavaScript to describe document structure, styling and behavior with no need to write HTML and CSS code**. This instrument is provided for creating rich web applications using the power of JavaScript with all its capabilities out-of-the-box. You can build a wide range of application types from simple static site, which can be rendered even from JSON data, to stateful single page applications with complex business logic.

#### UI Engine vs UI Framework vs UI Library

The difference between these types of software is a responsibility scope. You import a library to help you with something, e.g. rendering, while a framework provides a generic structure reducing amount of trivial work. UI engine is designed to encapsulate a powerful logic, which performs a task. In case of Swayer, **it consumes component schemas and outputs dynamic JavaScript application hiding lots of complexities under the hood.**

#### Why not to stick with hybrid syntax like JSX?

The answer is simple - you still play with HTML syntax, which has to be parsed before it can be processed with JavaScript. That's a quite big overhead. While HTML syntax is really well known - it was created for describing static web documents, not interactive apps. In any case we have to create abstractions to make web page dynamic, so we use plain objects with the full power of JavaScript to create DOM tree in the fastest way.

#### Why not to stick with CSS preprocessors like Stylus or Sass?

You simply don't need to use different CSS-like syntax with Swayer. JavaScript is more powerful and standardized language than any style preprocessor. Moreover, Swayer provides extended standard style declaration for convenience and brings selector abstraction, so you can just share or toggle styles as a simple JavaScript object. Swayer will distribute all your CSS rules across the app avoiding duplication and providing encapsulation.

**Important: do not assume HTML or CSS to be legacy languages!**<br> Swayer compiles component schemas down to the pure HTML/CSS on server side or directly to DOM/CSSOM in browsers while **making it consistent with your JavaScript logic**.

## Features:

- #### General
  - Tiny runtime
  - Pure modern JavaScript everywhere
  - Focus on performance and fast development
  - MVVM design pattern
  - ES6 modules as a single module system
  - Fast asynchronous rendering
  - No 3rd party dependencies in browser runtime
  - Works in modern browsers and Node.js
  - Server side rendering with hydration
  - Environment modules

- #### Components
  - Declarative schema based components
  - Atomicity and laziness by default
  - Reactive state models
  - Data binding
  - Element reflection
  - Context injection
  - Namespaces
  - Routing
  - Lifecycle hooks
- #### Styling
  - CSS selector abstraction
  - Extended property syntax
  - Sharable style rules
  - Animations
  - Data binding
- #### Communication
  - Events: bottom-up system or custom events
  - Channels: scoped cross-component messages

- #### Development tools
  - Command Line Interface (CLI)
    - create
    - build
    - render
    - serve
  - Typescript via JsDoc comments
  - ESLint

## Code examples

Simple head component:

```js
// Schema factory returning a component schema
// title is passed as input from other schemas
/** @returns {Schema} */
export default (title) => ({
  tag: 'head',
  // Children define component structure,
  // keep it readably flat and avoid high level of nesting
  children: [
    {
      tag: 'title',
      text: title,
    },
    {
      tag: 'link',
      attrs: {
        rel: 'icon',
        type: 'image/png',
        href: '/assets/favicon.png',
      },
    },
    {
      tag: 'meta',
      attrs: {
        charset: 'utf-8',
      },
    },
    {
      tag: 'meta',
      attrs: {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1.0',
      },
    },
  ],
});
```

Advanced component with model and reactive state:

```js
// Use ES6 modules
import { TodosModel } from './todos.model.js';

/** @type {Styles} */
const containerStyles = {
  // Styles are written in JavaScript: no selectors, fully sharable
  position: 'relative',
  background: 'white',
  boxShadow: `0 2px 4px 0 rgba(0, 0, 0, 0.2),
              0 25px 50px 0 rgba(0, 0, 0, 0.1)`,
};

// Schema factory returning a component schema
/** @returns {Schema<TodosModel>} */
export default () => {
  // Using models you can better separate you business logic
  const todosModel = new TodosModel();
  return {
    tag: 'main',
    styles: containerStyles,
    model: todosModel,
    children: [
      {
        // Namespaced schema reference
        path: '@todos/input/input.component',
        input: todosModel,
      },
      // Reaction is run on todosModel.state.show change
      // This is how you update the view in declarative way,
      // so forget about direct DOM access
      ({ show }) => show && [
        {
          path: `@todos/list/list.component`,
          input: todosModel,
        },
        {
          path: `@todos/counts/counts.component`,
          input: todosModel,
        },
      ],
    ],
  };
};
```

```js
import Storage from '../../utils/storage.js';

// Models hold your data store and its mutations,
// so that you can keep your components clear and readable
export class TodosModel {
  #storage = new Storage('swayer-todos');

  // State is mandatory model property,
  // keep reactive data here and bind it in components via reactions
  /** @type {TodosState} */
  state = {
    show: false,
    todos: [],
    counts: {
      completed: 0,
      remaining: 0,
    },
  };

  constructor() {
    this.#load();
    this.#updateVisibility();
    this.calculateCounts();
  }

  addTodo(title) {
    const data = { title, editing: false, completed: false };
    this.state.todos.push(data);
    this.#handleChanges();
  }

  removeTodo(index) {
    this.state.todos.splice(index, 1);
    this.#handleChanges();
  }

  clearCompleted() {
    const todos = this.state.todos;
    this.state.todos = todos.filter(({ completed }) => !completed);
    this.#handleChanges();
  }

  calculateCounts() {
    const todos = this.state.todos;
    const completed = todos.filter(({ completed }) => completed).length;
    const remaining = todos.length - completed;
    this.state.counts = { completed, remaining };
  }

  save() {
    this.#storage.save(this.state.todos);
  }

  #load() {
    this.state.todos = this.#storage.retrieve();
  }

  #handleChanges() {
    this.#updateVisibility();
    this.calculateCounts();
    this.save();
  }

  #updateVisibility() {
    this.state.show = this.state.todos.length > 0;
  }
}
```

## Swayer documentation

### 1. Terminology

- **CLI** (Command Line Interface) - a JavaScript tool used to help developers create, build, render and serve components.
- **CSR** (Client Side Rendering) - a rendering mode used to run engine in web browser and render dynamic application from schemas.
- **Channel** - a pub/sub entity, that provides a name for scoped data emission and subscription based on event emitter.
- **Component** - a schema, which is exported by default from module and groups other related schemas.
- **Context API** - a set of properties and methods provided by engine to help developer use its features.
- **Context** - an instance of schema created by engine during the rendering.
- **Element** - a schema describing a DOM element.
- **Engine** - Swayer UI engine.
- **Environment** - a module defining variables for app configuration.
- **Event** - an object, which flows from children to parents using native bubbling DOM events.
- **Hash** - a hash string calculated from schema properties for self identifying.
- **Hook** - an element lifecycle handler.
- **Hydration** - a process of DOM node binding restoration using schema hash.
- **Intercomponent communication** - a way of organizing data flow between different elements or components.
- **Model** - an object describing reactive data state and its changes.
- **Module** - an EcmaScript native module (ES6 module)
- **Namespace** - a name, which encapsulates a part of path and is resolved by loader.
- **Reaction** - a pure function, which binds model state to automate component reflection.
- **Reactivity** - an ability of an object to update its properties on data change.
- **Reflection** - a technique of metaprogramming, which enables instant data updates of underlying DOM, when schema properties change.
- **Route** - an object that configures how component is being routed basing on some pattern.
- **Router** - a routing controller, which is responsible for route management and navigation.
- **Routing** - a mechanism, which maps routes to corresponding schemas relying on url path.
- **SPA** (Single Page Application) - a rendering mode used to run engine in browser using a single predefined HTML page.
- **SSR** (Server Side Rendering) - a rendering mode used to run engine with Node.js and render HTML from schemas.
- **Schema child** - schema value, array of schema values or reaction.
- **Schema children** - an array of schema values or reactions describing underlying structure.
- **Component reference** - an object describing path and input for lazy loaded component.
- **Schema value** - a value, which can be a regular schema, component reference or any primitive value including nullish ones.
- **Schema** - an object describing element properties, structure and behavior.
- **State** - an object containing mutable reactive data.
- **Styles** - a schema property extending native CSSStyleDeclaration interface. Enables styling by abstracting CSS selectors.

### 2. Introduction

Swayer application is not trivial, because you don't have access neither to bare HTML, nor CSS. Instead, you should use pure JavaScript and you should never use DOM directly as it will break your app. It can be considered as a huge limitation, but it hides a lot of repetitive complexity, what reduces your work and improves overall development experience.

Typical Swayer application has a defined file structure:

- **main.js** - entry point of application, exports the root schema
- **env.js** - current environment file, which is being substituted during the build
- **app** - application source files
- **assets** - images, icons, fonts and other static staff
- **dist** - application build default directory (created by `swr build`)
- **node_modules** - installed npm packages
- **environments** - environment configurations (optional)
- **types** - static typing files for better dev experience (optional)
- project configuration files like package.json, .eslint.json, tsconfig.json, etc.

The minimal valid app must have a root schema in main.js. Consider this example:

```js
// exported root schema
export default {
  children: [
    // html element is the only one child possible in root schema
    {
      tag: 'html',
      attrs: { lang: 'en' },
      // html always consists of two mandatory children: head and body
      children: [
        {
          tag: 'head',
          children: [
            // title is also mandatory for valid web pages
            { tag: 'title', text: 'Page title' },
          ],
        },
        // app content is always placed in the body
        { tag: 'body', text: 'Simple text content' },
      ],
    },
  ],
}
```

The initial project with basic structure can be created with
`swr create mySwayerProject`, so that developer can concentrate on the application.

Then there are several options to run a Swayer application:

1. Use embedded http server with `swr serve` or `swr serve --mode=ssr` to run engine in SSR mode.
2. Build SPA app with `swr build && swr spa` and serve index.html as a single page with any web server like Nginx.
3. To build multipage app use `swr build`, then render an HTML page for each route with `swr render main.js --output myPage.html --route /` and serve these pages with any web server.
4. More advanced option is to leverage engine server platform to render schemas in Node.js:

```js
// path to root schema module
const entryPath = 'main.js';
// optional input data for root schema
const input = { data: 'Any data' };
// optional path which is used for component routing
const routingPath = '/';
const platform = new ServerPlatform(options);
const content = await platform.render(entryPath, input, routingPath);

// For more details see implementation: ./cli/httpServer.js
```

### 3. Swayer component system

Basically, schema is a template from which engine instantiates contexts representing *N-ary tree data structure* and are traversed with *Depth first preorder tree traversal algorithm*. With some performance optimizations this approach delivers fast asynchronous rendering for best user experience. The size of a component can vary from single `p` or `span` element or even a piece of text to the whole application, which is represented by the root schema.

Typical element can be described with such schema:

```js
const para = {
  tag: 'p',
  text: 'This is a paragraph',
}
```

But when default export is present, it becomes a component:

```js
export default {
  tag: 'p',
  text: 'This is a text component',
};
```

`export default` is mandatory for creating components. Bare `export` won't work as the engine relies on default export.

As the application grows it becomes hard to manage all schemas in a single file. To address this issue Swayer uses **ES6 standard modules** to separate components and load them on demand. It's possible to lazily load such components with component reference:

```js
{
  path: 'path/to/component',
  input: { data: 'actually any optional data' },
}
```

By default, path is absolute and starts from site root. Relative paths are not available, because engine loader cannot know about component's base url. However, this path can be namespaced.

Schemas can have not only the document structure, but also extensible features. One of them is **namespaces**, which is used for module path mapping. Conventionally namespaced paths start from `@` symbol and map to path from site root. Consider the following example:

```js
{
  namespaces: {
    '@foo': 'app/path/to/foo/folder',
    '@bar': 'app/path/to/bar/folder',
  },
}
```

By declaring namespaces developer gives an information about where engine can find modules to perform dynamic import under the hood or to send a message to distant component. Namespaces are scoped to the component it belongs to and all child components.

Consider a `app/features/text` folder with file containing a text component - `text.component.js`:

```js
export default {
  tag: 'p',
  text: 'This is a text component',
};
```

Now we can create namespace and reference the text component:

```js
{
  tag: 'div',
  namespaces: {
    '@text': 'app/features/text',
  },
  children: [
    { path: '@text/text.component' }
  ],
}
```

All modules are js files, so the extension can be skipped when using component reference.

Components can consume input if exported as a function, which is called **schema factory**. Consider the example, where title is passed to schema factory like an argument:

```js
{
  path: '@path/to/title.component',
  input: { title: 'My awesome title' },
}
```

```js
export default ({ title }) => ({
  tag: 'h1',
  text: title,
});
```

Factories allow developers to make their schemas fully dynamic parameterizing everything inside.

Unlike HTML-like template, schema is written in pure JavaScript, so we can use its capabilities to make it really powerful. But first, let's go through the basic syntax of the schema:

- **Tag** is obviously a name of HTML element tag. Consider the simplest element schema.
```js
{
  tag: 'div';
}
```
The piece of code above represents `<div></div>` HTML element.

- **Text** property corresponds to element's text node:

```js
{
  tag: 'button',
  text: 'Click me',
}
```

Such schema is rendered to `<button>Click me</button>`.

- **Children** include schemas, that belong to particular parent schema. Such approach is dictated by the tree-like nature of any web document. This array can hold any primitive values, schemas, component references or reactions:

```js
{
  tag: 'div'
  children: [
    // simple element schema
    { tag: 'span', text: 'Hello' },
    // a bare text node
    ' ',
    // simple element schema
    { tag: 'span', text: 'world' },
  ],
}
```

```js
{
  tag: 'div'
  children: [
    // component reference
    { path: '@path/to/some.component' },
    // component reference with input data
    {
      path: '@path/to/title.component',
      input: { title: 'A simple title' },
    },
  ],
}
```

```js
{
  tag: 'div'
  // children state reaction
  children: (state) => state.items.map((item) => ({
    tag: 'p',
    text: item.text,
  })),
}
```

```js
{
  tag: 'div'
  children: [
    // child state reaction
    (state) => ({ tag: 'p', text: state.text }),
  ],
}
```

// todo continue


- **Attrs** object corresponds to a set of element's attributes.
  <br><br>
  - Attrs declaration syntax:
    <!-- eslint-skip -->
    ```ts
    interface Attrs {
      // key-value attribute, see types/index.d.ts for more type info
      attrName: string;
    }
    ```
  - Attrs usage example:
    <!-- eslint-skip -->
    ```js
    {
      tag: 'input',
      attrs: {
        name: 'age',
        type: 'text',
      },
    }
    ```
    <br>
- **Props** object corresponds to a set of element's properties.
  <br><br>

  - Props declaration syntax:
    <!-- eslint-skip -->
    ```ts
    interface Props {
      // key-value property, see types/index.d.ts for more type info
      propName: string;
    }
    ```
  - Props usage example:
    <!-- eslint-skip -->
    ```js
    {
      tag: 'input',
      props: {
        value: 'Initial input value',
      },
    }
    ```
    <br>

- **State** is a custom object, where developer should store component related
  data.
  <br><br>

  - State declaration syntax:
    <!-- eslint-skip -->
    ```ts
    state: object;
    ```
  - State usage example:
    <!-- eslint-skip -->
    ```js
    {
      tag: 'button',
      state: {
        clickCounter: 0,
      },
    }
    ```
    <br>

- **Methods** are used to share some UI related code between listeners,
  subscribers and hooks.
  <br><br>
  - Methods declaration syntax:
    <!-- eslint-skip -->
    ```ts
    interface Methods {
      methodName(args: any): any;
    }
    ```
  - Method usage example:
    <!-- eslint-skip -->
    ```js
    {
      tag: 'form',
      methods: {
        prepareData(data) {
          // `this` instance is a reference to component instance
          // do something with data
        },
      },
    }
    ```
    <br>
- **Events** are used to listen to system or synthetic DOM events. There is a
  native event mechanism used under the hood, so it's good to leverage
  **event delegation** for bubbling events. Common usage is reacting for user
  actions and gathering user information. Additionally, you can transfer data to
  parent components with custom events, what is a bit simpler than using
  channels.
  <br><br>
  - Listeners declaration syntax:
    <!-- eslint-skip -->
    ```ts
    interface Events {
      eventName(event: Event): void;
    }
    ```
  - Listeners usage example:
    <!-- eslint-skip -->
    ```js
    {
      tag: 'input',
      events: {
        // event name matches any system events like click, mouseover, etc
        input(event) {
          // `this` instance is a reference to component instance
          // do something with event
        },
      },
    }
    ```
    <!-- eslint-skip -->
    ```js
    {
      tag: 'ul',
      events: {
        // event name matches emitted custom event name
        removeTodoEvent({ detail: todo }) {
          // `this` instance is a reference to component instance
          // do something with todo data
        },
      },
    }
    ```
  - Custom event emission declaration syntax:
    <!-- eslint-skip -->
    ```ts
    // component API
    emitEvent(name: string, data?: any): boolean;
    ```
  - Custom event emission usage example:
    <!-- eslint-skip -->
    ```js
    this.emitEvent('removeTodoEvent', todo);
    ```
    <br>
- **Channels** feature implements **pub/sub** communication pattern and is used
  for **intercomponent messaging**. The implementation leverages **EventEmitter**
  under the hood to manage subscriptions. This is a powerful way of creating data
  flow between components whenever they are located in the project. To prevent
  channel name conflicts, what is highly possible in big apps, a sender has to
  provide a **scope** of subscribers, so that only selected components receive
  emitted messages.<br><br>
  **Important**: you have to add `{ meta: import.meta }` into schema if using
  channels.
  <br><br>

  - Subscribers declaration syntax:
    <!-- eslint-skip -->
    ```ts
    interface Channels {
      channelName(dataMessage: any): void;
    }
    ```
  - Subscribers usage example:
    <!-- eslint-skip -->
    ```js
    {
      tag: 'form',
      meta: import.meta,
      channels: {
        // channel name matches developer defined name on emission
        addTodoChannel(todo) {
          // `this` instance is a reference to component instance
          // do something with todo data
        },
      },
    }
    ```
  - Message emission declaration syntax:
    <!-- eslint-skip -->
    ```ts
    // component API
    emitMessage(name: string, data?: any, options?: ChannelOptions): void;
    ```
    <!-- eslint-skip -->
    ```ts
    // Component API
    interface MessageOptions {
      // path or array of paths to folder or module
      // defaults to current module
      scope?: string | string[];
    }
    ```
  - Message emission usage examples:
    <!-- eslint-skip -->
    ```js
    // subsribers declared only in the same module will receive todo message
    this.emitMessage('addTodoChannel', { todo });
    ```
    <!-- eslint-skip -->
    ```js
    // subsribers declared only in main.component.js module will receive todo message
    const scope = './main/main.component';
    this.emitMessage('addTodoChannel', { todo }, { scope });
    ```
    <!-- eslint-skip -->
    ```js
    // subsribers declared in all modules under main folder will receive todo message
    const scope = '/app/main';
    this.emitMessage('addTodoChannel', { todo }, { scope });
    ```
    <!-- eslint-skip -->
    ```js
    // subsribers declared in header and footer modules will receive todo message
    const scope = ['./header/header.component', './footer/footer.component'];
    this.emitMessage('addTodoChannel', { todo }, { scope });
    ```

- **Hooks** are the special component handlers. They are typically used to run
  code at some point of component lifecycle. For example, it's possible to
  initialize some data when component and its children are created and ready to
  be managed. Right now **init** hook is available.
  <br><br>
  - Hooks declaration syntax:
    <!-- eslint-skip -->
    ```ts
    interface Hooks {
      init(): void;
    }
    ```
  - Hooks usage example:
    <!-- eslint-skip -->
    ```js
    {
      tag: 'form',
      hooks: {
        init() {
          // `this` instance is a reference to component instance
          // run initialization code
        },
      },
    }
    ```

### 4. Component styling

Styles in Swayer are simple JavaScript objects extending **CSSStyleDeclaration**
standard interface. All CSS properties are available in camelCase. It's possible
to add **inline styles via `attrs.style`** attribute or create **CSSStyleSheets**.
Swayer extends styling syntax by adding intuitive properties like **hover** as
it would be another set of CSS. Such approach enables **CSS selector
abstraction**, so that developer's cognitive work is reduced. Pseudo-classes,
pseudo-elements and animations are implemented with this abstraction.

Styles declaration syntax see in **types/index.d.ts**.

Styles usage examples:

- Inline style (not preferred):
  <!-- eslint-skip -->
  ```js
  {
    tag: 'p',
    attrs: {
      style: {
        // these props will be inlined
        fontSize: '14px',
        color: 'red',
      },
    },
  }
  ```
- CSS style properties:
  <!-- eslint-skip -->
  ```js
  {
    tag: 'p',
    styles: {
      // simply add some CSS properties
      fontSize: '14px',
      color: 'red',
    },
  }
  ```
- Pseudo classes/elements:
  <!-- eslint-skip -->
  ```js
  {
    tag: 'p',
    styles: {
      transition: 'backgroundColor 0.2s ease',
      // make this component blue on hover
      hover: {
        backgroundColor: 'blue',
      },
      // make the first-of-type text red
      first: {
        color: 'red',
      },
    },
  }
  ```
  <!-- eslint-skip -->
  ```js
  {
    tag: 'p',
    styles: {
      color: 'red',
      // make the first-of-type blue on hover
      first: {
        transition: 'backgroundColor 0.2s ease',
        hover: {
          backgroundColor: 'blue',
        },
      },
    },
  }
  ```
  <!-- eslint-skip -->
  ```js
  {
    tag: 'p',
    styles: {
      position: 'relative',
      // add before pseudo-element
      before: {
        content: `''`,
        position: 'absolute',
        right: '0',
      },
    },
  }
  ```
- Functional pseudo-classes:
  <!-- eslint-skip -->
  ```js
  {
    tag: 'p',
    styles: {
      // apply style rule equivalently to nth-of-type(2n)
      nth: {
        arg: '2n',
        rule: {
          borderBottom: '1px solid red',
          color: 'red',
        },
      },
    },
  }
  ```
- Animations:
  <!-- eslint-skip -->
  ```js
  {
    tag: 'div',
    styles: {
      // create multiple animations and apply them to component
      animations: [
        {
          name: 'fadeIn',
          props: 'linear 3s',
          keyframes: {
            'from': {
              opacity: 0,
            },
            '50%': {
              opacity: 0.5,
            },
            'to': {
              opacity: 1,
            },
          },
        },
        {
          name: 'fadeOut',
          props: 'linear 3s',
          keyframes: {
            from: {
              opacity: 1,
            },
            to: {
              opacity: 0,
            },
          },
        },
      ],
    },
  }
  ```
  <!-- eslint-skip -->
  ```js
  {
    tag: 'p',
    styles: {
      // apply existing animations to component
      animations: [
        { name: 'fadeIn' },
        { name: 'fadeOut', props: 'ease-out 2s' },
      ],
    },
  }
  ```

### 5. Component reflection

Component properties are meant to be **live**. This behavior makes updates to be
automatically applied to underlying HTML elements. At the moment reflection is
supported for the following features:

- Text
- Attrs, including inline style
- Props
- Events

Reflection for other features is going to be added in future releases.

### 6. Component API

Swayer creates some instruments for component management enabling dynamic
application development. While bootstrapping a component Swayer **enriches
context** used in developer-defined methods, events, channels and hooks.
Only **object method** declaration syntax is applicable as it's impossible
to change the context of arrow functions. Basically **this** reference is
a reference to a component, not schema. Right now the list of component API
is the following:

- Properties:
  - `original` - reference to original schema.
    <br><br>
- Methods:
  - `emitEvent(name: string, data?: any): boolean` - emits a synthetic
    DOM event bubbling up through the component hierarchy, see Events section
    for more details. Returns the result of
    native `dispatchEvent(event: Event): boolean`
  - `emitMessage(name: string, data?: any, options?: ChannelOptions): void` -
    emits a data message to the channel by name. See Channels section for more
    details. Returns void.
  - `destroy(): void` - remove component itself with its children and release memory.
  - `click(): void` - native click method.
  - `focus(): void` - native focus method.
  - `blur(): void` - native blur method.
    <br><br>
- Children methods:
  - `push(...schemas: Schema[]): Promise<Component[]>` - adds a new component
    to the end of children.
  - `pop(): Component` - removes the last child component.
  - `splice(start: number, deleteCount: number, ...replacements: Schema[]): Promise<Component[]>` -
    deletes or replaces several component children.

See types/index.d.ts for more type information. This API will be extended with
new properties and methods in future releases.

### 7. Application architecture and domain code

Swayer does not provide any restrictions of creating domain logics, but it's
very likely that the framework will implement some architectural best practises.
At the moment it's recommended to design apps with **feature components and
separated domain code**. Conventionally, developers should use only UI related
code in components and business code in separate modules using class instances
as singletons.
See [examples](https://github.com/metarhia/swayer/tree/main/examples) to learn
how it works.

## Browser compatibility

- Chromium based browsers (v80+)
- Firefox (v90+)
- Safari (v14.1+)
- Opera (v67+)

## License & Contributors

Copyright (c) 2021 Metarhia contributors.<br>
See GitHub for
full [contributors list](https://github.com/metarhia/swayer/graphs/contributors)
.<br>
Swayer framework is [MIT licensed](./LICENSE).<br>
Project coordinator: &lt;r.ogiyevich@gmail.com&gt;
