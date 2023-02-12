// eslint-disable-next-line
type UserObject = Record<string, any>;

type MaybeArray<T> = T | T[];

interface ComponentRef {
  path: string;
  input?: UserObject | BasicPrimitives | NullishPrimitives;
}

interface Route<TModel extends Model> {
  pattern: MaybeArray<string>;
  schema: RouteSchema<TModel>;
  canMatch?: (params: Record<string, string>) => boolean | Promise<boolean>;
}

interface Routes<TModel extends Model> {
  routes: Route<TModel>[];
}

interface Router {
  go(path: string): void;
}

interface Model<State = UserObject> extends UserObject {
  state: State;
}

type RouteSchema<TModel extends Model> = MaybeArray<SchemaValue<TModel>>
  | RouteSchemaResolver<TModel>;

type RouteSchemaResolver<TModel extends Model> = (
  params: Record<string, string>,
) => MaybeArray<SchemaValue<TModel>>
  | Promise<SchemaValue<TModel>>;

type BasicPrimitives = string | boolean | number | bigint | symbol;

type NullishPrimitives = null | undefined;

type Reaction<State, Result> = (state: State) => Result;

type SchemaValue<TModel extends Model> = Schema<TModel>
  | ComponentRef
  | Routes<TModel>
  | BasicPrimitives
  | NullishPrimitives;

type SchemaChild<TModel extends Model> = SchemaValue<TModel>
  | Reaction<TModel['state'], MaybeArray<SchemaValue<TModel>>>;

type SchemaProps = HTMLInputElement;

type ContextProps = Required<{
  [P in keyof SchemaProps]: SchemaProps[P];
}>;

type Props<State> = Partial<{
  [P in keyof SchemaProps]: SchemaProps[P] | Reaction<State, SchemaProps[P]>;
}>;

interface Schema<TModel extends Model, State = TModel['state']> {
  tag?: keyof HTMLElementTagNameMap;
  namespaces?: Record<string, string>,
  preload?: string[];
  text?: BasicPrimitives | Reaction<State, BasicPrimitives>;
  classes?: MaybeArray<string> | Reaction<State, MaybeArray<string>>;
  styles?: Styles<State> | Reaction<State, CSSPropsValue>;
  props?: Props<State>;
  attrs?: Attrs<State> | Reaction<State, Attrs<State>>;
  model?: TModel;
  events?: Events & ThisType<ContextAPI<TModel>>;
  channels?: Channels & ThisType<ContextAPI<TModel>>;
  hooks?: Partial<Hooks> & ThisType<ContextAPI<TModel>>;
  children?: SchemaChild<TModel>[] | Reaction<State, SchemaChild<TModel>[]>;
}

interface ChannelOptions<TModel extends Model> {
  scope?: MaybeArray<string>;
  select?: (
    contextAPI: ContextAPI<TModel>,
    index: number,
    array: ContextAPI<TModel>[],
  ) => boolean;
}

interface ContextAPI<TModel extends Model> {
  tag: keyof HTMLElementTagNameMap;
  text: BasicPrimitives;
  classes: MaybeArray<string>;
  styles: ContextStyles;
  props: ContextProps;
  attrs: ContextAttrs;
  model: TModel;
  events: Events & ThisType<ContextAPI<TModel>>;
  channels: Channels & ThisType<ContextAPI<TModel>>;
  hooks: Partial<Hooks> & ThisType<ContextAPI<TModel>>;

  moduleUrl: string;
  router: Router;
  emitEvent(name: string, data?): boolean;
  emitMessage(name: string, data?, options?: ChannelOptions<TModel>): void;
  click(): void;
  focus(): void;
  blur(): void;
}

type CSSPropsValue<State = UserObject> = Partial<
  Record<
    keyof CSSStyleDeclaration,
    string | number | Reaction<State, string | number>
  >
>;

type CSSProps<State> =
  CSSPropsValue<State> | Reaction<State, CSSPropsValue<State>>;

type ContextCSSProps = Partial<Record<
  keyof CSSStyleDeclaration,
  string | number
>>;

type AttrValue<State> = BasicPrimitives
  | NullishPrimitives
  | CSSProps<State>;

type ContextAttrValue = BasicPrimitives
  | NullishPrimitives
  | ContextCSSProps;

interface Attrs<State> {
  style?: CSSProps<State> | Reaction<State, CSSProps<State>>;
  [attr: string]: AttrValue<State>
    | Reaction<State, AttrValue<State>>;
}

interface ContextAttrs {
  style?: ContextCSSProps;
  [attr: string]: ContextAttrValue;
}

interface Events {
  [event: string]: (event) => void;
}

interface Channels {
  [channel: string]: (data?) => void;
}

interface Hooks {
  ready(): void | Promise<void>;
  destroy(): void;
}

interface PseudoFunction {
  arg: string;
  rule: PseudoStyles;
}

interface PseudoStyles extends CSSPropsValue {
  hover?: PseudoStyles;
  focus?: PseudoStyles;
  checked?: PseudoStyles;
  active?: PseudoStyles;
  disabled?: PseudoStyles;
  link?: PseudoStyles;
  visited?: PseudoStyles;
  first?: PseudoStyles;
  last?: PseudoStyles;
  before?: PseudoStyles;
  after?: PseudoStyles;
  placeholder?: PseudoStyles;
  nth?: PseudoFunction;
  not?: PseudoFunction;
}

interface CssAnimation {
  name: string;
  keyframes: {
    [key: string]: CSSPropsValue;
  };
}

interface Styles<State> extends PseudoStyles {
  animations?: CssAnimation[];
  compute?: MaybeArray<Reaction<State, CSSPropsValue>>;
}

interface ContextStyles extends PseudoStyles {
  animations?: CssAnimation[];
  compute?: MaybeArray<ContextCSSProps>;
}
