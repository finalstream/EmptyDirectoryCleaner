import Store from "electron-store";

export default class AppStore {
  private static _store = new Store();

  public static get instance(): Store {
    return this._store;
  }
}
