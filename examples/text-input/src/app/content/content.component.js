/** @type {Styles} */
const mainStyles = {
  margin: '100px auto',
  padding: '25px',
  maxWidth: '600px',
  backgroundColor: '#c7ffc7',
  borderRadius: '10px',
  border: '1px solid #82da82',
  boxShadow: '0px 5px 20px 0px rgba(0, 0, 0, 0.3)',
};

/** @type {Schema} */
export default {
  tag: 'main',
  styles: mainStyles,
  // children: new Array(1000).fill(null).map(() => ({
  //   path: '@content/reactive-input.component',
  // })),
  children: [
    {
      tag: 'h1',
      styles: { margin: 0 },
      text: 'Reactive input example',
    },
    {
      path: '@content/reactive-input.component',
    },
  ],
};
