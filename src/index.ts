import twemoji from '@twemoji/api'
import type {
  App,
  Editor,
  MarkdownPostProcessor,
  Workspace,
} from 'obsidian'
import {
  ItemView,
  MarkdownPreviewRenderer,
  MarkdownView,
  Modal,
  Notice,
  Plugin,
  PluginSettingTab,
  Setting,
} from 'obsidian'
import React from 'react'
import ReactDOM from 'react-dom'

import EmojiToolbar, { type EmojiSelection } from './ui/EmojiToolbar'

const DEF_DELAY = 1000
function sleep(ms: number) {
  return new Promise(resolve => activeWindow.setTimeout(resolve, ms || DEF_DELAY))
}

function insertText(editor: Editor, text: string) {
  if (text.length === 0 || text == null) return
  const cursor = editor.getCursor('from')
  editor.replaceRange(text, cursor, cursor)
  editor.setCursor({ line: cursor.line, ch: cursor.ch + text.length })
}

function getActiveView(workspace: Workspace): MarkdownView | ItemView | undefined {
  const markdownView = workspace.getActiveViewOfType(MarkdownView)
  if (markdownView) {
    return markdownView
  }
  const itemView = workspace.getActiveViewOfType(ItemView)
  if (itemView?.getViewType() === 'canvas') {
    // `canvas` is not part of Obsidian's public API; it is only used as a truthy marker that a canvas is active.
    return (itemView as ItemView & { canvas?: ItemView }).canvas
  }
}

class EmojiModal extends Modal {
  private reactComponent: React.ReactElement

  constructor(app: App, theme: 'light' | 'dark', isNative: boolean, editor: Editor) {
    super(app)
    this.reactComponent = React.createElement(EmojiToolbar, {
      onSelect: async (emoji: EmojiSelection) => {
        this.close()
        await sleep(10)
        insertText(editor, emoji.native)
      },
      onClose: () => {
        this.close()
      },
      theme: theme,
      isNative: isNative,
    })
  }

  async onOpen() {
    this.titleEl.empty()
    this.modalEl.id = 'emoji-modal'
    const { contentEl } = this
    ReactDOM.render(this.reactComponent, contentEl)
  }

  onClose() {
    const { contentEl } = this
    ReactDOM.unmountComponentAtNode(contentEl)
    contentEl.empty()
  }
}

interface EmojiToolbarSettings {
  twitterEmojiActive: boolean
}

const DEFAULT_SETTINGS: EmojiToolbarSettings = {
  twitterEmojiActive: false,
}

export default class EmojiPickerPlugin extends Plugin {
  settings: EmojiToolbarSettings = { ...DEFAULT_SETTINGS }

  public static postprocessor: MarkdownPostProcessor = (el: HTMLElement) => {
    twemoji.parse(el)
  }

  async onload(): Promise<void> {
    await this.loadSettings()

    this.addSettingTab(new SettingsTab(this.app, this))

    if (this.settings.twitterEmojiActive) {
      MarkdownPreviewRenderer.registerPostProcessor(EmojiPickerPlugin.postprocessor)
    }

    this.addCommand({
      id: 'emoji-picker:open-picker',
      name: 'Open emoji picker',
      editorCheckCallback: (checking: boolean, editor: Editor) => {
        if (!checking) {
          try {
            const activeView = getActiveView(this.app.workspace)
            const theme = this.app.isDarkMode() ? 'dark' : 'light'
            const isNative = !this.settings.twitterEmojiActive
            if (!activeView) {
              return
            }
            const modal = new EmojiModal(this.app, theme, isNative, editor)
            modal.open()
          } catch (e) {
            new Notice(`Error opening emoji picker: ${e.message}`)
          }
        }
        return true
      },
    })
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData())
  }

  async saveSettings() {
    await this.saveData(this.settings)
  }
}

class SettingsTab extends PluginSettingTab {
  plugin: EmojiPickerPlugin

  constructor(app: App, plugin: EmojiPickerPlugin) {
    super(app, plugin)
    this.plugin = plugin
  }

  display(): void {
    const { containerEl } = this

    containerEl.empty()

    new Setting(containerEl)
      .setName('Twitter Emoji (v16)')
      .setDesc('Improved emoji support, but may cause unexpected behavior.')
      .addToggle(toggle =>
        toggle.setValue(this.plugin.settings.twitterEmojiActive).onChange(async value => {
          this.plugin.settings.twitterEmojiActive = value
          await this.plugin.saveSettings()
          if (value) {
            MarkdownPreviewRenderer.registerPostProcessor(EmojiPickerPlugin.postprocessor)
          } else {
            MarkdownPreviewRenderer.unregisterPostProcessor(EmojiPickerPlugin.postprocessor)
          }
        }),
      )
  }
}
