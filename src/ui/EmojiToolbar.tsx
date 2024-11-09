import * as React from "react";
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'


interface EmojiToolbarProps {
  onClose: () => void;
  onSelect: (emoji: any) => void;
  theme: 'light' | 'dark';
  isNative?: boolean;
}

class EmojiToolbar extends React.Component<EmojiToolbarProps> {
  constructor(props: EmojiToolbarProps) {
    super(props);
  }

  handleClickOutside = (_evt: MouseEvent): void => {
    this.props.onClose();
  };

  render() {
    return (
      <div>
        <Picker
          onEmojiSelect={this.props.onSelect}
          autoFocus={true}
          data={data}
          theme={this.props.theme}
          // set="twitter"
          skinTonePosition="search"
          // previewPosition="none"
        />
      </div>
    );
  }
}

export default EmojiToolbar;
