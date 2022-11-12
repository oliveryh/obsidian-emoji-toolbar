import { App, MarkdownPostProcessor, editor,MarkdownPreviewRenderer, Modal, Notice, Plugin, PluginSettingTab, Setting } from "obsidian";
import React from "react";
import ReactDOM from "react-dom";
import twemoji from 'twemoji'

import EmojiToolbar from './ui/EmojiToolbar';

function inserText(editor:editor,text: string) {
  if (text.length === 0 || text==null) return;
  const cursor = editor.getCursor('from');
  editor.replaceRange(text, cursor, cursor);
   app.commands.executeCommandById("editor:focus");
   app.workspace.activeLeaf.view.editor.exec("goRight");
}

class EmojiModal extends Modal {
  private div: HTMLElement;
  private reactComponent: React.ReactElement;

  constructor(app: App, theme: str,editor:editor) {
    super(app)
    this.reactComponent = React.createElement(EmojiToolbar, {
      "onSelect": (emoji) => {
        this.close()
      //  document.execCommand('insertText', false, emoji.native)
      inserText(editor, emoji.native);
      },
      "onClose": () => {
        this.close()
      },
      "theme": theme,
    })
  }

  async onOpen() {
    this.titleEl.empty()
    this.modalEl.id = 'emoji-modal'
    const { contentEl } = this;
    ReactDOM.render(this.reactComponent, contentEl)
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}

interface MyPluginSettings {
  twemojiActive: boolean;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
  twemojiActive: true
}

export default class EmojiPickerPlugin extends Plugin {

  settings: MyPluginSettings;

  public static postprocessor: MarkdownPostProcessor = (
    el: HTMLElement,
  ) => {
    twemoji.parse(el)
  }

  async onload(): Promise<void> {

    await this.loadSettings()

    this.addSettingTab(new SettingsTab(this.app, this));

    if (this.settings.twemojiActive) {
      MarkdownPreviewRenderer.registerPostProcessor(EmojiPickerPlugin.postprocessor)
    }

    this.addCommand({
      id: 'emoji-picker:open-picker',
      name: 'Open emoji picker',
      hotkeys: [],
      checkCallback: async (checking: boolean) => {
        const leaf = this.app.workspace.activeLeaf;
        if (leaf) {
          if (!checking) {
            try {
              const theme = this.app.getTheme() === 'moonstone' ? 'light' : 'dark'
              let view = this.app.workspace.getActiveViewOfType(obsidian.MarkdownView);
              if (!view){return;};
              const  cmEditor = view.editor;
              const myModal = new EmojiModal(this.app, theme,cmEditor);
              myModal.open()
              document.getElementsByClassName("emoji-mart-search")[0].getElementsByTagName('input')[0].focus()
              document.getElementsByClassName("emoji-mart-search")[0].getElementsByTagName('input')[0].select()
            }
            catch (e) {
              new Notice(e.message)
            }
          }
          return true;
        }
        return false;
      }
    })
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}

class SettingsTab extends PluginSettingTab {
  plugin: EmojiPickerPlugin;

  constructor(app: App, plugin: EmojiPickerPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this

    containerEl.empty()

    containerEl.createEl('h1', {text: 'Emoji Toolbar'})
    containerEl.createEl('a', {text: 'Created by oliveryh', href: 'https://github.com/oliveryh/'})

    containerEl.createEl('h2', {text: 'Settings'})

    new Setting(containerEl)
      .setName('Twitter Emoji')
      .setDesc('Improved emoji support. Note: this applies to emoji search and preview only.')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.twemojiActive)
        .onChange(async (value) => {
          this.plugin.settings.twemojiActive = value
          await this.plugin.saveSettings()
          if (value) {
            MarkdownPreviewRenderer.registerPostProcessor(EmojiPickerPlugin.postprocessor)
          } else {
            MarkdownPreviewRenderer.unregisterPostProcessor(EmojiPickerPlugin.postprocessor)
          }
        }));
  }
}