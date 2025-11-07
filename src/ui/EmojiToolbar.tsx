import * as React from "react";
import twitterData from '@emoji-mart/data/sets/15/twitter.json'
import nativeData from '@emoji-mart/data'
import Picker from '@emoji-mart/react'


class EmojiToolbar extends React.Component {
  constructor(props) {
    super(props);
    this.onClose = props.onClose
    this.theme = props.theme
  }

  handleClickOutside = evt => {
    this.onClose()
  };

  render() {
    return (
      <div>
        <Picker
          onEmojiSelect={this.props.onSelect}
          autoFocus={true}
          data={this.props.isNative ? nativeData : twitterData}
          theme={this.props.theme}
          set={this.props.isNative ? "native" : "twitter"}
        />
      </div>
    )
  }
}

export default EmojiToolbar