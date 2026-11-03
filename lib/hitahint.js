"use babel";

import { CompositeDisposable } from "event-kit";
import { Extractor } from "./extractor";
import Settings from "./settings";

/*
 * ブラウザーの表示領域の矩形を取得する。
 */
function getViewportRect() {
  return {
    top: 0,
    right: window.innerWidth || document.documentElement.clientWidth,
    bottom: window.innerHeight || document.documentElement.clientHeight,
    left: 0,
  };
}

/*
 * 矩形が表示領域と交差しているか判定する。
 */
function isRectVisible(rect) {
  const viewport = getViewportRect();
  return (
    rect.width > 0 &&
    rect.height > 0 &&
    rect.right > viewport.left &&
    rect.left < viewport.right &&
    rect.bottom > viewport.top &&
    rect.top < viewport.bottom
  );
}

class HitaHint {
  inputKey = [];
  bind_handleKeyDown = null;
  subscriptions = new CompositeDisposable();
  shadow = null;

  /*
   * プラグインのコマンドを登録する。
   */
  activate() {
    const { commands } = inkdrop;
    this.subscriptions.add(
      commands.add(document.body, { "hitahint:show": this.show })
    );
  }

  /*
   * コマンドの購読を解除する。
   */
  deactivate() {
    this.subscriptions.dispose();
  }

  /*
   * ヒントを表示し、キー入力を受け付ける。
   */
  show = () => {
    this.inputKey = "";

    this.bind_handleKeyDown = this.handleKeyDown.bind(this);
    const pane = document.getElementById("app-container");
    pane.addEventListener("keydown", this.bind_handleKeyDown, true);
    // hint container
    this.shadow = document.createElement("div");
    this.shadow.className = "hitahint";
    // generate hints
    let targets = new Extractor().execute();
    const hints = this.genHints(targets.length);
    let i = 0;
    // 対象ごとにヒント要素を作成して表示領域に追加する。
    targets.forEach((target) => {
      const hint = hints[i++].toUpperCase();
      const ele = this.createHint(pane, target, hint);
      if (ele != null) {
        this.shadow.appendChild(ele);
      }
    });

    pane.appendChild(this.shadow);
    pane.focus();
  };

  /*
   * ヒント選択に使うキー入力を処理する。
   */
  handleKeyDown = (evnt) => {
    if (this.shadow == null) {
      return;
    }

    if (evnt.key == "Escape" || evnt.key == "Esc") {
      this.consumeKeyEvent(evnt);
      this.clear();
      return;
    }

    const key = evnt.key;
    if (
      key == "Control" ||
      key == "Shift" ||
      key == "Alt" ||
      key == "Meta" ||
      key.length != 1
    ) {
      return;
    }

    this.consumeKeyEvent(evnt);
    this.inputKey += key.toUpperCase();
    let hit = false;

    const elements = Array.from(this.shadow.children);
    const removes = [];
    for (let i = 0, max = elements.length; i < max; i++) {
      let ele = elements[i];
      // all match
      if (ele.hint == this.inputKey) {
        try {
          ele.open();
        } finally {
          this.clear();
        }
        break;
      }
      // partial match
      if (ele.hint.startsWith(this.inputKey)) {
        const reg = new RegExp("^" + this.inputKey);
        ele.innerHTML = `<font class='inputkey'>${this.inputKey}</font>${ele.hint.replace(
          reg,
          ""
        )}`;
        hit = true;
      } else {
        removes.push(ele);
      }
    }

    // end hit a hint
    if (hit) {
      // 入力に一致しない候補を表示から取り除く。
      removes.forEach((v) => this.shadow.removeChild(v));
    } else {
      this.clear();
    }
  };

  /*
   * キーイベントの既定動作と伝播を止める。
   */
  consumeKeyEvent = (evnt) => {
    evnt.preventDefault();
    evnt.stopPropagation();
  };

  /*
   * ヒント表示を片付け、キーイベントの監視を解除する。
   */
  clear = () => {
    if (this.shadow == null) {
      return;
    }
    const pane = document.getElementById("app-container");
    pane.removeChild(this.shadow);
    pane.removeEventListener("keydown", this.bind_handleKeyDown, true);
    this.shadow = null;
  };

  /*
   * 対象要素に対応するヒント要素と起動処理を作成する。
   */
  createHint = (pane, ele, text) => {
    const rect = ele.getBoundingClientRect();
    if (!isRectVisible(rect)) {
      return null;
    }

    // hint element
    const span = document.createElement("span");
    // hint attributes
    span.className = "hint";
    span.innerHTML = text;
    span.hint = text;

    // URL が設定されている場合にヒント要素へ保存する。
    const setUrl = (url) => {
      if (url != null && url !== "") {
        span.dataset.url = url;
      }
      return url;
    };

    const top = Math.max(0, rect.top - 10);
    const left = Math.max(0, rect.left);

    span.style.top = top.toString(10) + "px";
    span.style.left = left.toString(10) + "px";

    if (ele.className == "content") {
      // 対応する項目を開いてエディタへフォーカスを移す。
      span.open = () => {
        ele.parentElement.click();
        inkdrop.commands.dispatch(document.body, "editor:focus");
      };
      return span;
    }

    if (ele.classList.contains("link-compact-mark")) {
      const url = setUrl(ele.url || ele.dataset.url);
      // コンパクトリンクの URL を開く。
      span.open = () => open(url);
      return span;
    }

    if (ele.classList.contains("cm-url")) {
      const url = setUrl(ele.innerText);
      // エディタ内リンクの URL を開く。
      span.open = () => open(url);
      return span;
    }

    if (ele.tagName == "IMG") {
      setUrl(ele.src);
      // 画像拡大パッケージに対象画像を開かせる。
      span.open = () => {
        inkdrop.commands.dispatch(document.body, "dblclick-expansion-image:open", {
          url: ele.src,
        });
      };
      return span;
    }

    if (ele.type == "checkbox") {
      // 対応するチェックボックスを切り替える。
      span.open = () => ele.click();
      return span;
    }

    if (ele.id.startsWith("note-")) {
      const url = setUrl("inkdrop://note/" + ele.id.split("note-")[1]);
      // ノートへのリンクを開く。
      span.open = () => open(url);
      return span;
    }

    if (ele.title == "Back") {
      // 戻る操作を行い、エディタへフォーカスを戻す。
      span.open = () => {
        ele.click();
        // 戻る操作後にエディタへフォーカスを移す。
        setTimeout(
          () => inkdrop.commands.dispatch(document.body, "editor:focus"),
          50
        );
      };
      return span;
    }

    const url = setUrl(ele.href);
    // その他のリンク先を開く。
    span.open = () => open(url);
    return span;
  };

  /*
   * 指定件数分のヒント文字列を生成する。
   * 生成方法は cVim の実装に基づく。
   */
  genHints = (M) => {
    const base = Settings.hintcharacters.length;
    if (M <= base) {
      return Settings.hintcharacters.slice(0, M).split("");
    }

    // 数値を指定の基数でヒント文字列に変換する。
    var codeWord = function (n, b) {
      for (var i = 0, word = []; i < b; i++) {
        word.push(Settings.hintcharacters.charAt(n % base));
        n = ~~(n / base);
      }
      return word.reverse().join("");
    };

    var b = Math.ceil(Math.log(M) / Math.log(base));
    var cutoff = Math.pow(base, b) - M;
    var codes0 = [],
      codes1 = [];

    for (var i = 0, l = ~~(cutoff / (base - 1)); i < l; i++)
      codes0.push(codeWord(i, b - 1));
    codes0.sort();
    for (; i < M; i++) codes1.push(codeWord(i + cutoff, b));
    codes1.sort();
    return codes0.concat(codes1);
  };
}

const plugin = new HitaHint();

module.exports = {
  config: {
    hintcharacters: {
      title: "hintcharacters",
      type: "string",
      default: "asdfghlk",
    },
  },

  /*
   * プラグインを有効化する。
   */
  activate() {
    plugin.activate();
  },

  /*
   * プラグインを無効化する。
   */
  deactivate() {
    plugin.deactivate();
  },
};
