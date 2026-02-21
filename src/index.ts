import twemoji from '@twemoji/api'
import type {
  App,
  Editor,
  MarkdownPostProcessor,
} from 'obsidian'
import {
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

import EmojiToolbar from './ui/EmojiToolbar'

const DEF_DELAY = 1000
function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms || DEF_DELAY))
}

function insertText(editor: Editor, text: string) {
  if (text.length === 0 || text == null) return
  const cursor = editor.getCursor('from')
  editor.replaceRange(text, cursor, cursor)
  editor.setCursor({ line: cursor.line, ch: cursor.ch + text.length })
}

/** Selection context captured when the command is run in `.inline-title`. */
interface InlineTitleTarget {
  element: HTMLElement
  range: Range | null
}

function getInlineTitleTarget(): InlineTitleTarget | null {
  const active = document.activeElement as HTMLElement | null
  const titleEl = active?.closest('.inline-title') as HTMLElement | null
  if (!titleEl) return null

  const selection = window.getSelection()
  if (selection?.rangeCount) {
    const range = selection.getRangeAt(0)
    if (titleEl.contains(range.commonAncestorContainer)) {
      return { element: titleEl, range: range.cloneRange() }
    }
  }

  return { element: titleEl, range: null }
}

function insertIntoInlineTitle(target: InlineTitleTarget, text: string) {
  if (text.length === 0 || text == null) return
  const el = target.element
  if (!el.isConnected) return
  el.focus()
  const selection = window.getSelection()
  if (!selection) return

  
  const cursor = target.range?.cloneRange() ?? document.createRange()
  if (!target.range) {
    cursor.selectNodeContents(el)
    cursor.collapse(false)
  }

  cursor.deleteContents()
  const textNode = document.createTextNode(text)
  cursor.insertNode(textNode)
  cursor.setStartAfter(textNode)
  cursor.collapse(true)
  selection.removeAllRanges()
  selection.addRange(cursor)
  el.dispatchEvent(new Event('input', { bubbles: true }))
}

class EmojiModal extends Modal {
  private reactComponent: React.ReactElement

  constructor(
    app: App,
    theme: string,
    isNative: boolean,
    editor: Editor | null,
    titleTarget: InlineTitleTarget | null,
  ) {
    super(app)
    this.reactComponent = React.createElement(EmojiToolbar, {
      onSelect: async (emoji: { native: string }) => {
        this.close()
        await sleep(10)
        if (titleTarget) {
          insertIntoInlineTitle(titleTarget, emoji.native)
        } else if (editor) {
          insertText(editor, emoji.native)
        }
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
    contentEl.empty()
  }
}

interface MyPluginSettings {
  twitterEmojiActive: boolean
}

const DEFAULT_SETTINGS: MyPluginSettings = {
  twitterEmojiActive: false,
}

export default class EmojiPickerPlugin extends Plugin {
  settings: MyPluginSettings

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
      hotkeys: [],
      checkCallback: (checking: boolean) => {
        const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView)
        if (!markdownView?.editor) return false
        if (!checking) {
          try {
            const theme = this.app.isDarkMode() ? 'dark' : 'light'
            const isNative = !this.settings.twitterEmojiActive
            const titleTarget = getInlineTitleTarget()
            const myModal = new EmojiModal(
              this.app,
              theme,
              isNative,
              titleTarget ? null : markdownView.editor,
              titleTarget,
            )
            myModal.open()
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

    containerEl.createEl('h1', { text: 'Emoji Toolbar' })
    containerEl.createEl('a', { text: 'Created by oliveryh', href: 'https://github.com/oliveryh/' })

    containerEl.createEl('h2', { text: 'Settings' })

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
