import { Vue } from "vue-property-decorator";
import { MessageLevel } from "./MessageLevel";
export default class CommonVue extends Vue {
  /**
   * メッセージを表示する
   * @param level メッセージレベル
   * @param message メッセージ
   */
  public showMessage(level: MessageLevel, message: string) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const t: any = this;
    t.$message({
      type: level,
      message: message,
    });
  }
}
