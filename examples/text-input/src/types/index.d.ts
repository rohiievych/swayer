// Add your types here like the following,
// then use in JsDoc type comments across your app,
// TypeScript will check your js code and show suggestions,
// example: /** @implements {ITextModel} */ for model class,
// Schema, Model and other types come from Swayer types

interface TextState {
  text: string;
}

interface ITextModel extends Model<TextState> {
  state: TextState;
  update(text: string): void;
}
