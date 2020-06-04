import RowDirectory from "./RowDirectory";
import { Dirent } from "fs";

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

  private _directories: RowDirectory[];
  public get directories(): RowDirectory[] {
    return this._directories;
  }
  public set directories(v: RowDirectory[]) {
    this._directories = v;
  }

  public updateDirectories(directories: Dirent[]) {
    directories.forEach(directory => {
      this.directories.push(new RowDirectory(directory.name));
    });
  }

  public clearDirectories() {
    this.directories.splice(0, this.directories.length);
  }
}
