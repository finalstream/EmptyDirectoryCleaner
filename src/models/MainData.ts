export default class MainData {
  constructor() {
    this._searchDirectory = "";
    this._directories = [];
  }

  /**
   * 検索ディレクトリ
   */
  private _searchDirectory: string;
  public get searchDirectory(): string {
    return this._searchDirectory;
  }
  public set searchDirectory(v: string) {
    this._searchDirectory = v;
  }

  private _directories: string[];
  public get directories(): string[] {
    return this._directories;
  }
  public set directories(v: string[]) {
    this._directories = v;
  }

  public updateDirectories(directories: string[]) {
    directories.forEach(directory => {
      this.directories.push(directory);
    });
  }

  public clearDirectories() {
    this.directories.splice(0, this.directories.length);
  }
}
