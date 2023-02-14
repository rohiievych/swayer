# Swayer - schema based UI engine

[![npm version](https://img.shields.io/npm/v/swayer)](https://www.npmjs.com/package/swayer)
[![npm downloads/month](https://img.shields.io/npm/dm/swayer.svg)](https://www.npmjs.com/package/swayer)
[![npm downloads](https://img.shields.io/npm/dt/swayer.svg)](https://www.npmjs.com/package/swayer)
[![snyk](https://snyk.io/test/github/rohiievych/swayer/badge.svg)](https://snyk.io/test/github/rohiievych/swayer)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/rohiievych/swayer/blob/main/LICENSE)

**JavaScript-only UI engine** for fast and low overhead development

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

- See online [Todo Application demo](https://rohiievych.github.io/swayer/examples/todo-app)
- Play with [example](https://github.com/rohiievych/swayer/tree/main/examples/todo-app) code to investigate how it works

## Contacts

Swayer Telegram community:
  - channel: [Swayer](https://t.me/SwayerEngine)
  - chat: [Swayer Chat](https://t.me/SwayerChat)

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

## Features

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
  - Computed styles
  - Sharable style rules
  - CSS selector abstraction
  - Extended property syntax
  - Animations
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

Simple component describing a paragraph with text:

```js
/** @type {Schema} */
export default {
  tag: 'p',
  text: 'Hello World!',
};
```

Advanced component describing how text is being reflected in a paragraph while typing in a text input:

```js
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
  compute: (state) => ({
    boxShadow: `0 0 ${state.text.length}px 0 #bababa`,
  }),
};

/** @type {Schema<ITextModel>} */
export default {
  tag: 'div',
  styles: { marginTop: '40px' },
  model: new TextModel(),
  children: [
    {
      tag: 'input',
      styles: inputStyles,
      attrs: {
        type: 'text',
        placeholder: 'Type something here...',
      },
      events: {
        input() {
          const value = this.props.value;
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
```

## Swayer documentation

### Table of contents

1. [Terminology](#1-terminology)
2. [Introduction](#2-introduction)
3. [Swayer component system](#3-swayer-component-system)
4. [The schema concept](#4-the-schema-concept)
   - [Tag](#tag)
   - [Text](#text)
   - [Children](#children)
   - [Attrs](#attrs)
   - [Props](#props)
   - [Classes](#classes)
   - [Events](#events)
   - [Channels](#channels)
   - [Hooks](#hooks)
5. [Schema Context API](#5-schema-context-api)
6. [Reactivity](#6-reactivity)
   - [Model](#model)
   - [How Swayer reactivity reduces your work](#how-swayer-reactivity-reduces-your-work)
7. [Styling](#7-styling)
   - [Simple styles](#simple-styles)
   - [Pseudo classes and elements](#pseudo-classes-and-elements)
   - [Functional pseudo-classes](#functional-pseudo-classes)
   - [Animations](#animations)
   - [Computed styles](#computed-styles)
   - [Inline styles](#inline-styles)
8. [Routing](#8-routing)
   - [Route types example](#route-types-example)
   - [Router](#router)

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

// for more details see implementation: ./cli/httpServer.js
```

### 3. Swayer component system

Basically, schema is a template from which engine instantiates contexts representing *N-ary tree data structure* and are traversed with *Depth first preorder tree traversal algorithm*. With some performance optimizations this approach delivers fast asynchronous rendering for best user experience. The size of a component can vary from single `p` or `span` element or even a piece of text to the whole application, which is represented by the root schema.

Typical element can be described with such schema:

```js
const paragraph = {
  tag: 'p',
  text: 'This is a paragraph',
}
```

But when `default export` is present, it becomes a component module:

```js
export default {
  tag: 'p',
  text: 'This is a text component',
};
```

In case if a fragment is needed, schema array can be created as a component:

```js
export default [
  {
    tag: 'p',
    text: 'This is the first text component',
  },
  {
    tag: 'p',
    text: 'This is the second text component',
  },
];
```

**`export default` is mandatory for creating components**. Bare `export` won't work as the engine relies on default export.

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

### 4. The schema concept

Unlike HTML-like template, schema is written in pure JavaScript, so we can use programming capabilities to make it really powerful. Schemas can have different types depending on its usage and can represent not only elements, but also bare text and some configurations like namespaces or routes. But first, let's go through the basic syntax of the **element schema**:

#### Tag

Tag is obviously a name of HTML element tag. Used by engine to create a corresponding DOM element. Consider the simplest element schema:

```js
{
  tag: 'div',
}
```
The piece of code above is rendered to `<div></div>` HTML element.

#### Text

Text property corresponds to the element's text node. Any primitive value is valid as well as a reaction.

The following schema is rendered to `<button>Click me</button>`:

```js
{
  tag: 'button',
  text: 'Click me',
}
```

Button text is automatically updated, when the `state.text` is changed:

```js
{
  tag: 'button',
  // reaction
  text: (state) => state.text,
}
```

#### Children

Children include schemas, that belong to particular parent schema. Such approach is dictated by the tree-like nature of any web document. This array can hold any primitive values, schemas, component references or reactions:

```js
{
  tag: 'div',
  children: [
    // simple element schema
    { tag: 'span', text: 'Hello' },
    // a bare text node
    ' - ',
    // simple element schema
    { tag: 'span', text: 'world' },
  ],
}
```

```js
{
  tag: 'div',
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
  tag: 'div',
  // children state reaction
  children: (state) => state.items.map((item) => ({
    tag: 'p',
    text: item.text,
  })),
}
```

```js
{
  tag: 'div',
  children: [
    // child state reaction
    (state) => ({ tag: 'p', text: state.text }),
  ],
}
```

#### Attrs

Attributes object corresponds to a set of element's attributes:

```js
{
  tag: 'input',
  attrs: {
    name: 'age',
    type: 'text',
  },
}
```

Such element is rendered to `<input name="age" type="text">`.

Reactions are also applicable to each attribute or the whole object:

```js
{
  tag: 'input',
  attrs: {
    // attribute reaction
    name: (state) => state.name,
    type: 'text',
  },
}
```

```js
{
  tag: 'input',
  // all attributes reaction
  attrs: (state) => ({
    name: state.name,
    type: state.type,
  }),
}
```

#### Props

Properties object corresponds to a set of element's properties. In the following example the value property is set to the input:

```js
{
  tag: 'input',
  props: {
    value: 'Initial input value',
  },
}
```

Unlike attributes, properties belong directly to the DOM element object, so cannot be visualized in the markup.

Reactions are possible as well:

```js
{
  tag: 'input',
  props: {
    // value property reaction
    value: (state) => state.value,
  },
}
```

```js
{
  tag: 'input',
  // all properties reaction
  props: (state) => ({
    value: state.value,
  }),
}
```

#### Classes

Classes is a convenient alias for `attrs.class`, where developers can manage their custom css classes. Usually it becomes helpful, when using external css libraries like Bootstrap or font icons like FontAwesome. The valid value of this property is a string with space separated classes or an array of string classes:

```js
{
  tag: 'i',
  classes: 'fa fa-solid',
}
```

```js
{
  tag: 'i',
  classes: ['fa', 'fa-solid'],
}
```

Reaction can be also applied here:

```js
{
  tag: 'i',
  // reaction
  classes: (state) => state.classes,
}
```

#### Events

Events object is used to listen to system or custom DOM events. There is a native event mechanism used under the hood, so it's good to leverage **event delegation** for bubbling events. General usage is reacting for user actions. Another case is child-to-parent communication. Consider the following example:

```js
{
  tag: 'input',
  events: {
    // event name matches any system events like click, mouseover, etc
    input(event) {
      // `this` instance is a reference to the Context API
    },
  },
}
```

Using the Context API developer can create custom events. For example:

```js
const listItem = {
  tag: 'li',
  events: {
    click() {
      const data = { prop: 'some data' };
      this.emitEvent('dataCreated', data);
    },
  },
};
```

Then listen to custom event it in the upper elements:

```js
{
  tag: 'ul',
  events: {
    // event name matches emitted custom event name
    // get a detail as data from CustomEvent instance
    dataCreated({ detail: data }) {
      // do something with data here
    },
  },
  children: [listItem],
}
```

#### Channels

This feature implements **pub/sub** communication pattern and is used for **intercomponent messaging** providing a low level of code coupling. The implementation leverages **EventEmitter** under the hood to manage subscriptions. This is a powerful way of creating data flow between components whenever they are located in the project.
<br><br>
To prevent channel name conflicts, what is highly possible in big apps, a sender has to provide a **scope** of subscribers, so that only those components receive emitted messages. Scope accepts a folder or file path or an array of such paths. Paths can be absolute to the site root or namespaced like path in component reference. By default, messages are delivered to subscribers in the component boundaries if no scope specified.
<br><br>
Another crucial option of a channel message is a **select** function, which can help to deliver message only to those element contexts, which are selected by this function. Select function predicate must return boolean value to satisfy or filter out consumer contexts.

Consider the following example using scoped channel:

```js
// message consumer
{
  tag: 'footer',
  // object holding all message subscribers
  channels: {
    // create a 'headerMessage' topic subscriber
    headerMessage(data) {
      // handle passed data
    }
  },
}
```

```js
// message provider
{
  tag: 'header',
  events: {
    // send message to footer component on header click
    click() {
      const data = { prop: 'header data' };
      const options = { scope: '@app/path/to/footer' };
      this.emitMessage('headerMessage', data, options);
    },
  },
}
```

Using select option is helpful if we have multiple instances of the same schema on the page. Consider this example:

```js
// message consumer
const createListItem = (id) => ({
  tag: 'li',
  attrs: { id },
  // object holding all message subscribers
  channels: {
    // create a 'changeItemMessage' topic subscriber
    changeItemMessage(data) {
      // handle passed data
    }
  },
});
```

```js
// message provider
{
  tag: 'ul',
  events: {
    // send message to selected li's on click
    click() {
      const data = { prop: 'message for concrete item' };
      // select only second list item as a message consumer by id
      const select = (ctx) => ctx.attrs === 'second-li';
      this.emitMessage('changeItemMessage', data, { select });
    },
  },
  // create multiple instances of the same schema
  children: [
    createListItem('first-li'),
    createListItem('second-li'),
    createListItem('third-li'),
  ],
}
```

Note: consider channels as a synchronous in-memory message broker with scope and select options as restrictions not to end up with lots of messy messages. Subscriptions are self-destroyable to prevent memory leaks.

#### Hooks

These methods are typically used to run code at some point of element context lifecycle. For example, it's possible to initialize some data when the application is ready or when the context is destroyed to perform some cleaning actions. For now these hooks are available:

```js
{
  tag: 'div',
  hooks: {
    // application is fully rendered and it's safe to perform changes
    ready() {
      // `this` is a reference to context API here
    },
    // the context of this schema is near to be destroyed, so it's
    // the best place to clean up it
    destroy() {
      // `this` is a reference to context API here
    },
  },
}
```

### 5. Schema Context API

In terms of Swayer engine a **context** is an object, which is created in runtime for each real DOM node. The best way to explain it is to think about the analogue: schema relates to its context like a class relates to its instance. This means, that we can create a lot of contexts from a single schema. While processing schemas, the engine creates contexts with predefined properties and methods providing an API to access data and the engine functionality. It's done using the method binding, so **it's very crucial to create methods, not arrow functions as they won't accept the context**.

Some public context properties hold the current values provided by the schema like tag, text, attrs, etc. Some can reflect on the real node on change: text, attrs, props, classes, events; while others cannot be changed at all: tag, channels, hooks. Children property is fully internal and not visible in the context API, because it represents the DOM structure, which should not be modified imperatively. Instead, developers can only use reactions to mutate children in declarative way.

Another part of context API provides public engine functionality:

- `moduleUrl: string` - get the full url of the component module. Helpful for locating the component.
<br><br>
- `router: Router` - the object helping with the navigation. E.g. call `this.router.go(path)` to navigate to another route.
<br><br>
- `emitEvent(name: string, data?: any): boolean` - emits a synthetic DOM event bubbling up through the component hierarchy, see [Events](#events) section for more details. Returns the result of native `dispatchEvent(event: Event): boolean`
<br><br>
- `emitMessage(name: string, data?: any, options?: ChannelOptions): void` - emits a data message to the channel by name. See [Channels](#channels) section for more details. Returns void.
<br><br>
- `click(): void` - native click method.
<br><br>
- `focus(): void` - native focus method.
<br><br>
- `blur(): void` - native blur method.

See [types/index.d.ts](https://github.com/rohiievych/swayer/blob/main/types/index.d.ts) for detailed typing information. This API will be extended in the future.

### 6. Reactivity

Probably the most powerful feature of the Swayer engine. Reactivity is the ability of an object to react on some changes. Reactivity reduces a lot of imperative code by defining **reactions** - pure arrow functions, that are invoked by the engine providing state binding to the schema context.

The basic syntax is `(state) => schema value`, where state is the special object containing reactive user data and schema value is the recalculated schema. Thanks to JavaScript Proxy and metaprogramming techniques, the engine reruns this function everytime the properties of the state, used in this function, are changed. Reactive approach allows us to concentrate on data removing all the trivial work, that is hidden in the engine machinery.

Reactions have some caveats to keep in mind:

- **Reactions are synchronous, don't make them async**. This is a JavaScript Proxy limitation.
- **Do not set state properties inside a reaction as will throw "Maximum call stack size exceeded" error**.
This is like the recursive function without exit condition.

To make things clear, consider the reactivity flow under the hood: `update state -> call reaction(state) -> reflect schema property -> update DOM/CSSOM`.

If the state is updated inside the reaction, we get: `update state -> reaction(state) -> update state -> reaction(state) ...` - endless recursion.

#### Model

Model is a schema property object, which is responsible for holding state and its mutations. Thus, `state` is the mandatory property in every model. It is also the part of [Context API](#5-schema-context-api) and can be used inside events, channels or hooks. Defining the model as a separate class makes schemas concise. Therefore, when developer create a model, he can fully focus on the state and how it is going to be mutated providing some model methods. In terms of MVVM, view model is a schema and the model is the object with state described above.

Model have some caveats to keep in mind:

- The model scope is restricted to the component if it's defined in the root element of that component, what means it's shared among all it's elements, excluding those, which referenced as child components. This is done to prevent state leakage through the whole app, but making it useful across the component.
- If a model is defined for the concrete element, it takes a precedence over the component's one.
- If a model is defined in a static schema, the related state will stay the same for all instantiated contexts. To make it unique for each context, it must be recreated with schema factory.

#### How Swayer reactivity reduces your work

See the following component example showing how reactivity works:

```js
{
  tag: 'div',
  // define a model
  model: {
    // define a state with some data inside
    state: {
      // this is a reactive property
      text: 'Initial text',
    },
    // a method to mutate a state
    update(newText) {
      this.state.text = newText;
    },
  },
  children: [
    {
      tag: 'input',
      attrs: {
        type: 'text',
        placeholder: 'Type here...',
      },
      events: {
        input() {
          // update the model on text input
          // this will trigger the reaction in p element
          const text = this.props.value;
          this.model.update(text);
        },
      },
    },
    {
      tag: 'p',
      // reaction with state recalculation, state is the model.state
      // described above in the root component
      text: (state) => 'Hello ' + state.text,
    }
  ],
}
```

In case of vanilla JS, we would implement the same functionality in this way:

```html
<!-- Initial HTML markup -->
<div>
  <input type="text", placeholder="Type here...">
  <p>Initial text</p>
</div>
```

```js
// Get paragraph element imperatively and create text updater
const p = document.querySelector('p');
const updatePara = (text) => p.textContent = 'Hello ' + text;

// Get input element imperatively and bind updater to text input
const input = document.querySelector('input');
input.addEventListener('input', (event) => updateText(event.target.value));
```

The difference in development time is not very big here. But what if we want to modify this feature and add another text container with same text updates? In the schema based approach, we need to add a new child near the paragraph:

```js
{
  tag: 'span',
  text: (state) => 'Hello ' + state.text,
}
```

Do the same with vanilla:

```html
<!-- Update markup with a new span -->
<span>Initial text</span>
```

```js
// Get span element imperatively and create text updater
const span = document.querySelector('span');
const updateSpan = (text) => span.textContent = 'Hello ' + text;

// Get input element imperatively and bind updater to text input
const input = document.querySelector('input');
input.addEventListener('input', (event) => updateSpan(event.target.value));
```

Then we have to perform refactoring to reduce the code, but the guy using schema is already implementing the next feature... So we have just done in three times more work! It could be done better using React, but try to apply such change just in two lines of code - developer still need to write another piece of JSX markup and a bit of scripts. Swayer engine will do it automatically, allowing developer to concentrate on features. So what does the engine here - it guarantees the linear time of development, while keeping the app performant, readable and reusable.

### 7. Styling

All styles are written in schemas using JavaScript. This means that developer don't need to use additional preprocessors with random syntax. Moreover, no need to write even CSS selectors thankfully to **CSS selector abstraction**. To style the element developer just need to define the `styles` object in element schema, which can be also shared among other element schemas as a plain object. The engine will effectively resolve these styles into the pieces of pure CSS directly in markup or CSSOM. So the page will contain only those styles, that used for elements on current page and not more.

The engine extends styling syntax by adding intuitive properties like **hover** as it would be another set of CSS properties. Pseudo-classes, pseudo-elements and animations are implemented too.

Let's go through the styling capabilities:

#### Simple styles

```js
{
  tag: 'p',
  styles: {
    // add some CSS properties like in the CSS rule,
    // but in camelCase
    fontSize: '14px',
    color: 'red',
  },
}
```

#### Pseudo classes and elements

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

#### Functional pseudo-classes

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

#### Animations

```js
{
  tag: 'div',
  styles: {
    // create multiple animations and apply them to element
    animations: [
      {
        // CSS animation name
        name: 'fadeIn',
        // CSS animation properties
        props: 'linear 3s',
        // CSS animation keyframes
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

```js
{
  tag: 'p',
  styles: {
    // apply existing animations to element
    animations: [
      { name: 'fadeIn' },
      { name: 'fadeOut', props: 'ease-out 2s' },
    ],
  },
}
```

#### Computed styles

Styles can be written with reactions too. This is very helpful as developer can bind a model state to the styles, so there is no more need to mess with class toggling. Simply create a reaction and return styles calculated on the state.

Consider the following examples:

```js
{
  tag: 'p',
  model: {
    state: {
      isValid: true,
    },
  },
  // all styles are changed on `state.isValid` value change
  styles: (state) => state.isValid
    ? { color: 'black' }
    : { color: 'red' },
}
```

```js
{
  tag: 'p',
  model: {
    state: {
      isValid: true,
    },
  },
  styles: {
    // these styles won't be affected
    fontSize: '14px',
    fontWeight: 'bold',
    // compute only the needed styles
    compute: (state) => state.isValid
      ? { color: 'black' }
      : { color: 'red' },
  },
}
```

#### Inline styles

Additionally, it's possible to add inline styles in `attrs.style` as an object. Unlike the `styles` property, these styles inlined into the style attribute.

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

The code above is rendered to: `<p style="font-size: 14px; color: red;"></p>`


### 8. Routing

Routing is the mechanism used for navigation through different components basing on the url path. Routing is the crucial part of any Single Page Application as it performs navigation without full page reload. The engine provides a special schema, where the right route is matched and the corresponding schema is rendered. This is done by creating a tree of routers for each group of routes.

#### Route types example

```js
{
  tag: 'div',
  children: [
    {
      // for each group of routes a child router is created
      // child router holds the segment of the path
      // excluding parent's segment
      routes: [
        // pattern is the string, that the url path is going to match
        // in this case empty string means no path, it will be applied
        // for '/'
        {
          pattern: '',
          // the element schema to be rendered
          schema: {
            tag: 'p',
            text: 'Paragraph element is routed!',
          },
        },
        {
          // matches /products
          pattern: 'products',

          // the component reference schema to be rendered
          schema: {
            path: '@app/path/to/products.component',
            input: 'any data',
          },
        },
        {
          // pattern supports parameters with :param syntax
          // matches /products/12345
          pattern: 'products/:id',

          // a function that allows route to be matched on some
          // condition, useful to validate params
          canMatch: (params) => params.id === '12345',

          // schema can be represented as arrow function or async
          // function that extracts params from path returing
          // a schema to be rendered
          schema: (params) => ({
            tag: 'p',
            text: `Product ${params.id} is routed!`,
          }),
        },
        {
          // array pattern makes a union of possible path segments
          // consider this as || (or), matches /admin or /adm
          pattern: ['admin', 'adm'],

          // simple text schema to be rendered
          schema: 'Here will be admin page!',
        },
        {
          // any route pattern, useful when redirecting to 404 page
          // if no route match found, this will be selected
          // matches /any/path
          pattern: '**',
          schema: '404',
        },
      ],
    }
  ],
}
```

The routes in one group have a match, where the winner is the route with the most specific pattern, so **the order of routes matters**.

Here is a small cheat sheet example for routes matching order:
1. `''` (empty path segment)
2. `:param` (parameter segment)
3. `products` (static segment)
4. `**` (any segment)

#### Router

The Context API provides a `router` property. Currently, one method can be used:
- Go to the relative path segment, applied to the nearest router: `this.router.go('path/segment')`
- Go to the absolute path, applied to the root router: `this.router.go('/root/path')`

`go` method updates the path or path segment and reloads corresponding router, which will match his routes against new path.

Example:

```js
{
  tag: 'button',
  events: {
    click() {
      this.router.go('/root/path');
    },
  },
}
```

## Compatibility

- Chromium based browsers (v80+)
- Firefox (v90+)
- Safari (v14.1+)
- Opera (v67+)
- Node.js (v16+)

## License & Contributors

Copyright (c) 2023 Roman Ohiievych.<br>
See GitHub for full [contributors list](https://github.com/rohiievych/swayer/graphs/contributors).<br>
Swayer framework is [MIT licensed](./LICENSE).<br>
Original author: &lt;roman@swayer.dev&gt;<br>

**Totally made in Ukraine** 🇺🇦
