import React from 'react'
import Svg, { Path, G, SvgProps } from 'react-native-svg'

const Chat: React.FC<SvgProps> = props => (
  <Svg viewBox="0 0 19.599 19.599" {...props}>
    <G data-name="Group 1483">
      <Path
        data-name="Path 566"
        d="M0 0h19.6v19.6H0z"
        fill="none"
        transform="translate(-3877.237 -2423) translate(3877.237 2423)"
      />
      <Path
        data-name="Path 567"
        d="M16.7 5.266h-.817V11.8a.819.819 0 01-.817.817h-9.8v.817A1.638 1.638 0 006.9 15.066h8.166l3.266 3.266V6.9A1.638 1.638 0 0016.7 5.266zm-2.45 4.083V3.633A1.638 1.638 0 0012.616 2H3.633A1.638 1.638 0 002 3.633v10.616l3.266-3.266h7.349a1.638 1.638 0 001.634-1.634z"
        transform="translate(-3877.237 -2423) translate(3877.237 2423) translate(-.367 -.367)"
        fill={props.fill}
      />
    </G>
  </Svg>
)

export default Chat
