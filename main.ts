import { Plugin } from 'obsidian';
import emoji from 'emojilib';

const QUICK_SWITCHER_ID = 'switcher';
const EMOJIPREFIX = '@';

const indicatorStyle =
  'color: var(--text-accent); width: 2.5em; text-align: center; float:left; font-weight:800;';

function getQuickSwitcher(app) {
  const switcher = app.internalPlugins.getPluginById(QUICK_SWITCHER_ID);
  if (!switcher) {
    return null;
  }

  return switcher.instance.modal.constructor;
}

function createEmojiPickerModal(app, emojis) {
  const QuickSwitcher = getQuickSwitcher(app);
  if (QuickSwitcher === null) {
    return null;
  }

  class EmojiPicker extends QuickSwitcher {
    constructor(app) {
      super(app);
    }

    onOpen() {
      // force reset suggestions so any suggestions from a previous operation
      // won't be incorrectly used for symbol search
      this.chooser.setSuggestions([]);
      this.isOpen = true;

      // prefix inut with @ symbol
      this.inputEl.value = EMOJIPREFIX;
      this.inputEl.focus();
      this.updateSuggestions();
    }

    getSearchData() {
      const {
        inputEl: { value },
      } = this;
      let startIndex = 0;

      startIndex = value.indexOf(EMOJIPREFIX) + EMOJIPREFIX.length;

      return EmojiPicker.extractTokens(value, startIndex);
    }

    static extractTokens(str, startIndex = 0) {
      // shamelessly stolen directly from Obsidian
      const p = /[\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,\-.\/:;<=>?@\[\]^_`{|}~]/;
      const u = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff66-\uff9f]/;
      const b = /\s/;
      const query = str.slice(startIndex).toLowerCase();
      const tokens = [];
      let pos = 0;

      for (let i = 0; i < query.length; i++) {
        const char = query.charAt(i);

        if (b.test(char)) {
          if (pos !== i) {
            tokens.push(query.slice(pos, i));
          }

          pos = i + 1;
        } else if (p.test(char) || u.test(char)) {
          if (pos !== i) {
            tokens.push(query.slice(pos, i));
          }

          tokens.push(char);
          pos = i + 1;
        }
      }

      if (pos !== query.length) {
        tokens.push(query.slice(pos, query.length));
      }

      return { query, tokens, fuzzy: query.split('') };
    }

    updateSuggestions() {
      const searchData = this.getSearchData();
      const suggestions = this.makeSuggestions(searchData);

      this.chooser.setSuggestions(suggestions);
    }

    makeSuggestions(searchData) {
      const suggestions = [];
      const hasSearchTerm = searchData.query.length > 0;

      emojis.forEach((item) => {
        let sugg;

        if (hasSearchTerm) {
          const match = this.match(searchData, item);

          if (match !== null) {
            sugg = {
              match,
            };
          }
        } else {
          sugg = {
            match: null,
          };
        }

        if (sugg) {
          sugg.item = item;
          suggestions.push(sugg);
        }
      });

      if (hasSearchTerm) {
        suggestions.sort((a, b) => b.match.score - a.match.score);
      }
      return suggestions;
    }

    getItemText(item) {
      const { symbol } = item;

      let text;
      text = symbol.heading;
      return text;
    }

    insertTextAtCursor(editor, text) {
      var doc = editor.getDoc();
      var cursor = doc.getCursor();
      doc.replaceRange(text, cursor);
    }

    onChooseOption(suggestionItem) {
      let activeLeaf = this.app.workspace.activeLeaf;
      let editor = activeLeaf.view.sourceMode.cmEditor;
      this.insertTextAtCursor(editor, suggestionItem.symbol.char);
    }

    renderSuggestion(sugg, parentEl) {
      super.renderSuggestion(sugg, parentEl);
      this.updateSuggestionElForMode(sugg, parentEl);
    }

    updateSuggestionElForMode(sugg, parentEl) {
      const { symbol } = sugg.item;

      const indicatorEl = createEl('div', {
        text: symbol.char,
        attr: { style: indicatorStyle },
      });
      parentEl.insertAdjacentElement('afterbegin', indicatorEl);
    }
  }

  return new EmojiPicker(app);
}

function loadEmojis() {
  function titleCase(string) {
    let sentence = string.toLowerCase().split('_');
    for (let i = 0; i < sentence.length; i++) {
      sentence[i] = sentence[i][0].toUpperCase() + sentence[i].slice(1);
    }

    return sentence.join(' ');
  }

  let items = emoji.ordered.map((name) => {
    return {
      symbol: {
        heading: titleCase(name),
        char: emoji.lib[name].char,
      },
    };
  });

  return items;
}

export default class EmojiPickerPlugin extends Plugin {
  onload() {
    this.emojis = loadEmojis();
    this.addCommand({
      id: 'emoji-picker:open-picker',
      name: 'Open emoji picker',
      hotkeys: [],
      checkCallback: (checking) => {
        let leaf = this.app.workspace.activeLeaf;
        if (leaf) {
          if (!checking) {
            new createEmojiPickerModal(this.app, this.emojis).open();
          }
          return true;
        }
        return false;
      },
    });
  }

  onunload() {
    this.modal = null;
  }
}
