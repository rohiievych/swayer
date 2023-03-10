/** @type {Styles} */
export const todoStyles = {
  fontSize: '24px',
  borderBottom: '1px solid #ededed',
  last: {
    borderBottom: 'none',
  },
};

/** @type {Styles} */
export const todoTitleStyles = {
  wordBreak: 'break-all',
  padding: '15px 150px 15px 60px',
  display: 'block',
  lineHeight: 1.2,
  transition: 'color 0.1s ease',
  fontWeight: 400,
  compute: ({ completed }) => (completed
    ? {
      color: '#d9d9d9',
      textDecoration: 'line-through',
    }
    : {
      color: '#484848',
      textDecoration: 'none',
    }
  ),
};

/** @type {Styles} */
export const todoToggleStyles = {
  position: 'absolute',
  left: '10px',
  top: '10px',
  display: 'inline-block',
  width: '44px',
  height: '40px',
  compute: ({ completed }) => ({
    backgroundImage: completed
      ? 'url(assets/icons/checkedCircle.svg)'
      : 'url(assets/icons/circle.svg)',
  }),
  cursor: 'pointer',
  zIndex: 1,
};

/** @type {Styles} */
const navigateBtnStyles = {
  display: 'inline-flex',
  alignItems: 'center',
  backgroundColor: 'white',
  padding: '10px',
  boxShadow: '0 0 5px 0 #bababa',
  borderRadius: '5px',
  textDecoration: 'none',
  color: '#2d2c2c',
  transition: 'all 0.15s ease',
  border: 'none',
  cursor: 'pointer',
};

/** @type {Styles} */
export const openTodoBtnStyles = {
  position: 'absolute',
  top: 'calc(50% - 16px)',
  right: '62px',
  height: '32px',
  opacity: 0.4,
  hover: {
    opacity: 1,
  },
  ...navigateBtnStyles,
};

/** @type {Styles} */
export const backToListBtnStyles = {
  ...navigateBtnStyles,
  hover: {
    boxShadow: '0 5px 15px 3px #bababa',
  },
};

/** @type {Styles} */
export const removeTodoButtonStyles = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'absolute',
  top: '0',
  right: '10px',
  bottom: '0',
  width: '40px',
  height: '40px',
  margin: 'auto 0',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  opacity: 0.2,
  animations: [
    {
      name: 'fadeIn',
      keyframes: {
        'from': {
          opacity: 0.2,
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
      keyframes: {
        'from': {
          opacity: 1,
        },
        '50%': {
          opacity: 0.5,
        },
        'to': {
          opacity: 0.2,
        },
      },
    },
  ],
  compute: [
    ({ buttonAnimation }) => {
      let animation;
      switch (buttonAnimation) {
        case 'show': animation = 'ease-in 0.15s forwards fadeIn'; break;
        case 'hide': animation = 'ease-out 0.15s forwards fadeOut'; break;
        default: animation = 'none';
      }
      return { animation };
    },
  ],
};

/** @type {Styles} */
export const editTodoStyles = {
  position: 'absolute',
  top: '0px',
  bottom: '0px',
  zIndex: 1,
  width: '72%',
  padding: '6px 6px 6px 60px',
  border: 'none',
  outline: 'none',
  fontSize: '24px',
  lineHeight: '1.4em',
  color: 'inherit',
  boxShadow: 'rgb(0 0 0 / 20%) 0px -1px 5px 0px inset',
  boxSizing: 'border-box',
};
