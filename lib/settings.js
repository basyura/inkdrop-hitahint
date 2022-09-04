"use babel";

class Settings {
  /*
   *
   */
  constructor() {
    inkdrop.config.observe("hitahint.hintcharacters", (newValue) => {
      this.hintcharacters = newValue;
    });
  }
}

export default new Settings();
