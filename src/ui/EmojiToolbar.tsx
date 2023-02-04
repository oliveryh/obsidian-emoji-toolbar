import * as React from "react";
import { NimblePicker } from 'emoji-mart'
import twitterData from 'emoji-mart/data/twitter.json'


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
        <NimblePicker
          onSelect={this.props.onSelect}
          autoFocus={true}
          native={this.props.isNative}
          set='twitter'
          data={twitterData}
          theme={this.props.theme}
        />
      </div>
    )
  }
}

export default EmojiToolbar