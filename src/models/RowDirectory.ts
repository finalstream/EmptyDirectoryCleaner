export default class RowDirectory {
  constructor(name: string) {
    this._name = name;
    this._isSelected = true;
  }

  private _name: string;
  public get name(): string {
    return this._name;
  }
  public set name(v: string) {
    this._name = v;
  }

  private _isSelected: boolean;
  public get isSelected(): boolean {
    return this._isSelected;
  }
  public set isSelected(v: boolean) {
    this._isSelected = v;
  }
}
