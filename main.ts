import { App, FuzzySuggestModal, Plugin, FuzzyMatch, MarkdownPostProcessor, MarkdownPostProcessorContext, MarkdownPreviewRenderer, PluginSettingTab, Setting } from 'obsidian';
import orderedEmoji from 'unicode-emoji-json/data-ordered-emoji'
import emojiNames from 'unicode-emoji-json/data-by-emoji'
import twemoji from 'twemoji'

const indicatorStyle: string =
  'color: var(--text-accent); width: 2.5em; text-align: center; float:left; font-weight:800;';

interface MyPluginSettings {
  twemojiActive: boolean;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	twemojiActive: true
}

export default class MyPlugin extends Plugin {
  emojis: EmojiItem[]
  settings: MyPluginSettings;

  public static postprocessor: MarkdownPostProcessor = (
    el: HTMLElement,
    ctx: MarkdownPostProcessorContext
  ) => {
    twemoji.parse(el)
  }

  loadEmojis(): EmojiItem[] {
    function titleCase(string: string) {
      let sentence = string.toLowerCase().split('_');
      for (let i = 0; i < sentence.length; i++) {
        sentence[i] = sentence[i][0].toUpperCase() + sentence[i].slice(1);
      }
  
      return sentence.join(' ');
    }

    let items = orderedEmoji.map((name: string) => {
      return {
        name: titleCase(emojiNames[name]["name"]),
        char: name,
        imgHtml: twemoji.parse(name)
      }
    })
  
    return items;
  }

	async onload() {

    this.emojis = this.loadEmojis();

    await this.loadSettings()

    this.addSettingTab(new SettingsTab(this.app, this));

    if (this.settings.twemojiActive) {
      MarkdownPreviewRenderer.registerPostProcessor(MyPlugin.postprocessor)
    }

    this.addCommand({
			id: 'emoji-picker:open-picker',
      name: 'Open emoji picker',
      hotkeys: [],
			checkCallback: (checking: boolean) => {
				let leaf = this.app.workspace.activeLeaf;
				if (leaf) {
					if (!checking) {
						new EmojiFuzzySuggestModal(this.app, this.emojis, this.settings).open();
					}
					return true;
				}
				return false;
			}
		});

	}

	onunload() {
  }
  
  async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

interface EmojiItem {
  name: string;
  char: string;
  imgHtml: string;
}


class EmojiFuzzySuggestModal extends FuzzySuggestModal<EmojiItem> {
  app: App;
  emojis: EmojiItem[];
  settings: MyPluginSettings;

  constructor(app: App, emojis: EmojiItem[], settings: MyPluginSettings) {
      super(app);
      this.app = app;
      this.emojis = emojis;
      this.settings = settings;
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

    var indicatorEl = createEl('div', {
      attr: { style: indicatorStyle },
    });

    if (this.settings.twemojiActive) {
      indicatorEl.innerHTML = item.item.imgHtml
    } else {
      indicatorEl.textContent = item.item.char
    }
    
    el.insertAdjacentElement('afterbegin', indicatorEl);
  }

  onChooseItem(item: EmojiItem, evt: MouseEvent | KeyboardEvent): void {
    document.execCommand('insertText', false, item.char)
  }
}

class SettingsTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		let {containerEl} = this;

		containerEl.empty();

    containerEl.createEl('h1', {text: 'Emoji Toolbar'});
    containerEl.createEl('a', { text: 'Created by oliveryh', href: 'https://github.com/oliveryh/'}));

    containerEl.createEl('h2', {text: 'Settings'});

		new Setting(containerEl)
			.setName('Twitter Emoji')
      .setDesc('Improved emoji support. Note: this applies to emoji search and preview only.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.twemojiActive)
				.onChange(async (value) => {
					this.plugin.settings.twemojiActive = value;
          await this.plugin.saveSettings();
          if (value) {
            MarkdownPreviewRenderer.registerPostProcessor(MyPlugin.postprocessor)
          } else {
            MarkdownPreviewRenderer.unregisterPostProcessor(MyPlugin.postprocessor)
          }
				}));
	}
}
