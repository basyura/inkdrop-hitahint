"use babel";

class Settings {
  /*
   * 設定変更を監視してヒント文字列を更新する。
   */
  constructor() {
    // 設定値の変更をインスタンスへ反映する。
    inkdrop.config.observe("hitahint.hintcharacters", (newValue) => {
      this.hintcharacters = newValue;
    });
  }
}

export default new Settings();
