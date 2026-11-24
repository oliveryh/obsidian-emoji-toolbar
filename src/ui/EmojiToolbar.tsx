import * as React from 'react'
import twitterData from '@emoji-mart/data/sets/15/twitter.json'
import nativeData from '@emoji-mart/data'
import Picker from '@emoji-mart/react'

export interface EmojiSelection {
  native: string
}

export interface EmojiToolbarProps {
  onSelect: (emoji: EmojiSelection) => void | Promise<void>
  onClose: () => void
  theme: 'light' | 'dark'
  isNative: boolean
}

class EmojiToolbar extends React.Component<EmojiToolbarProps> {
  handleClickOutside = (_evt: unknown) => {
    this.props.onClose()
  }

  render() {
    return (
      <div>
        <Picker
          onEmojiSelect={this.props.onSelect}
          autoFocus={true}
          data={this.props.isNative ? nativeData : twitterData}
          theme={this.props.theme}
          set={this.props.isNative ? 'native' : 'twitter'}
        />
      </div>
    )
  }
}

export default EmojiToolbar
