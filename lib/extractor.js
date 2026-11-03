"use babel";

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
 * 2 つの矩形が交差する領域を返す。
 */
function intersectRects(rectA, rectB) {
  const top = Math.max(rectA.top, rectB.top);
  const right = Math.min(rectA.right, rectB.right);
  const bottom = Math.min(rectA.bottom, rectB.bottom);
  const left = Math.max(rectA.left, rectB.left);

  if (right <= left || bottom <= top) {
    return null;
  }

  return { top, right, bottom, left };
}

/*
 * 要素が子要素を切り抜くスタイルを持つか判定する。
 */
function isClippingElement(ele) {
  const style = window.getComputedStyle(ele);
  return /(auto|scroll|hidden|clip)/.test(
    `${style.overflow}${style.overflowX}${style.overflowY}`
  );
}

/*
 * 要素とその祖先要素によって見えている領域を取得する。
 */
function getVisibleRect(ele) {
  let visibleRect = getViewportRect();
  let current = ele;

  while (
    current != null &&
    current !== document.body &&
    current !== document.documentElement
  ) {
    if (isClippingElement(current)) {
      visibleRect = intersectRects(visibleRect, current.getBoundingClientRect());
      if (visibleRect == null) {
        return null;
      }
    }
    current = current.parentElement;
  }

  return visibleRect;
}

export class Extractor {
  /*
   * 現在の画面モードに応じてヒント対象を集める。
   */
  execute = () => {
    const editor = document.querySelector(".editor");
    let targets = [];
    if (editor.classList.contains("editor-viewmode-preview")) {
      targets = this.#extractFromPreview();
    } else {
      targets = this.#extractFromEditor();
    }

    targets = targets.concat(this.#extractFromNoteListBar());
    targets = targets.concat(this.#extractFromSideBar());

    return targets;
  };

  /*
   * プレビュー内のリンク、チェックボックス、画像を集める。
   */
  #extractFromPreview = () => {
    const pane = document.querySelector(".mde-preview");
    // a
    let links = this.#extractTargets(pane, "a");
    // checkbox
    const checks = this.#extractTargets(pane, "input[type='checkbox']");
    links = links.concat(checks);
    // viewer support
    if (inkdrop.packages.activePackages["dblclick-expansion-image"] != null) {
      const images = this.#extractTargets(pane, "IMG");
      links = links.concat(images);
    }

    return links;
  };

  /*
   * エディタ内のリンクとコンパクトリンクを集める。
   */
  #extractFromEditor = () => {
    const pane = document.querySelector(".editor");
    // 書式用マークを除いた URL 要素を抽出する。
    let links = this.#extractTargets(pane, ".cm-url").filter((v) => {
      return !v.classList.contains("cm-formatting");
    });

    const compactLinks = this.#extractTargets(pane, ".link-compact-mark[data-url]");
    // URL を持つコンパクトリンクを候補に追加する。
    compactLinks.forEach((span) => {
      const url = span.dataset.url;
      if (url == null) {
        return;
      }
      span.url = url;
      links.push(span);
    });

    return links;
  };

  /*
   * 指定セレクターに一致し、表示領域内にある要素を集める。
   */
  #extractTargets = (pane, target_selector) => {
    if (pane == null) {
      return [];
    }

    const visibleRect = getVisibleRect(pane);
    if (visibleRect == null) {
      return [];
    }

    // 矩形が可視領域と交差する要素に絞り込む。
    return Array.from(pane.querySelectorAll(target_selector)).filter((ele) => {
      const rect = ele.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) {
        return false;
      }
      return intersectRects(rect, visibleRect) != null;
    });
  };

  /*
   * ノート一覧バーの項目を集める。
   */
  #extractFromNoteListBar = () => {
    const bar = document.querySelector(".note-list-bar-layout");
    if (bar == null) {
      return [];
    }
    const links = this.#extractTargets(bar, ".note-list-bar-item");
    return links;
  };

  /*
   * サイドバーのノート、ブック、状態、戻る項目、タグを集める。
   */
  #extractFromSideBar = () => {
    const bar = document.querySelector(".sidebar-layout");
    if (bar == null) {
      return [];
    }

    // 非表示になっていない「すべてのノート」項目だけを残す。
    const all = this.#extractTargets(bar, ".sidebar-menu-item-all-notes").filter(
      (v) => {
        return !v.parentElement.classList.contains("hidden");
      }
    );
    const books = this.#extractTargets(bar, ".sidebar-menu-book-list-item .content");
    const statuses = this.#extractTargets(
      bar,
      ".sidebar-menu-status-list-item .content"
    );
    // 有効な戻る項目だけを残す。
    const backs = this.#extractTargets(bar, ".back-button").filter((v) => {
      const ele = v.parentElement.querySelector(".content");
      if (ele == null) {
        return false;
      }
      return ele.innerText != "<Missing>";
    });
    const tags = this.#extractTargets(bar, ".sidebar-menu-tag-list-item .content");
    const links = all.concat(books).concat(statuses).concat(backs).concat(tags);

    return links;
  };
}
