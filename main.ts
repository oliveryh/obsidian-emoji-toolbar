import { App, FuzzySuggestModal, Plugin, FuzzyMatch, Notice, MarkdownView } from 'obsidian';
import emoji from 'emojilib';


const indicatorStyle: string =
  'color: var(--text-accent); width: 2.5em; text-align: center; float:left; font-weight:800;';

export default class MyPlugin extends Plugin {
  emojis: EmojiItem[]

  loadEmojis(): EmojiItem[] {
    function titleCase(string: string) {
      let sentence = string.toLowerCase().split('_');
      for (let i = 0; i < sentence.length; i++) {
        sentence[i] = sentence[i][0].toUpperCase() + sentence[i].slice(1);
      }
  
      return sentence.join(' ');
    }
  
    let items = emoji.ordered.map((name) => {
      return {
        name: titleCase(name),
        char: emoji.lib[name].char,
      };
    });
  
    return items;
  }

	onload() {

    this.emojis = this.loadEmojis();

		this.addCommand({
			id: 'open-sample-modal',
      name: 'Open Sample Modal',
      hotkeys: [
        {
          modifiers: ["Mod", "Shift"],
          key: "o",
        },
      ],
			checkCallback: (checking: boolean) => {
				let leaf = this.app.workspace.activeLeaf;
				if (leaf) {
					if (!checking) {
						new EmojiFuzzySuggestModal(this.app, this.emojis).open();
					}
					return true;
				}
				return false;
			}
		});

	}

	onunload() {
	}
}

interface EmojiItem {
  name: string;
  char: string;
}


class EmojiFuzzySuggestModal extends FuzzySuggestModal<EmojiItem> {
  app: App;
  emojis: EmojiItem[];

  constructor(app: App, emojis: EmojiItem[]) {
      super(app);
      this.app = app;
      this.emojis = emojis;
  }

  getItems(): EmojiItem[] {
      return this.emojis;
  }

  getItemText(item: EmojiItem): string {
      return item.name;
  }

  renderSuggestion(item: FuzzyMatch<EmojiItem>, el: HTMLElement) {
    super.renderSuggestion(item, el);
    this.updateSuggestionElForMode(item, el);
  }

  updateSuggestionElForMode(item: FuzzyMatch<EmojiItem>, el: HTMLElement) {

    const indicatorEl = createEl('div', {
      text: item.item.char,
      attr: { style: indicatorStyle },
    });
    el.insertAdjacentElement('afterbegin', indicatorEl);
  }

  insertTextAtCursor(view: MarkdownView, text:string): void {
    let editor = view.sourceMode.cmEditor
    let doc = editor.getDoc();
    let cursor = doc.getCursor();
    doc.replaceRange(text, cursor);
  }

  onChooseItem(item: EmojiItem, evt: MouseEvent | KeyboardEvent): void {
    let activeEditor = this.app.workspace.getActiveViewOfType(MarkdownView)
    if (activeEditor) {
      this.insertTextAtCursor(activeEditor, item.char)
    } else {
      new Notice("You'll need to open a markdown editor to insert an emoji");
    }
  }
}