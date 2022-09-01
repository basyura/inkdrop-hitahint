"use babel";

class Settings {
  /*
   *
   */
  constructor() {
    inkdrop.config.observe("hitahint.hintcharacters", (newValue) => {
      if (newValue == null || newValue == "") {
        newValue = "kasdfghl";
      }
      this.hintcharacters = newValue;
    });
  }
}

export default new Settings();
