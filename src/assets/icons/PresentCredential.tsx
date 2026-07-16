import React from 'react'
import Svg, { G, Path, SvgProps } from 'react-native-svg'

const PresentCredential: React.FC<SvgProps> = (props) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" {...props}>
    <G data-name="Group 1347">
      <Path data-name="Rectangle 790" fill="none" d="M0 0h24v24H0z" />
    </G>
    <G data-name="Group 1348">
      <Path
        data-name="Path 373"
        d="M20 7h-5V4a2.006 2.006 0 0 0-2-2h-2a2.006 2.006 0 0 0-2 2v3H4a2.006 2.006 0 0 0-2 2v11a2.006 2.006 0 0 0 2 2h16a2.006 2.006 0 0 0 2-2V9a2.006 2.006 0 0 0-2-2ZM9 12a1.5 1.5 0 1 1-1.5 1.5A1.5 1.5 0 0 1 9 12Zm3 6H6v-.43a1.516 1.516 0 0 1 .92-1.39 5.246 5.246 0 0 1 4.16 0 1.522 1.522 0 0 1 .92 1.39Zm1-9h-2V4h2Zm4.25 7.5h-2.5a.755.755 0 0 1-.75-.75.755.755 0 0 1 .75-.75h2.5a.755.755 0 0 1 .75.75.755.755 0 0 1-.75.75Zm0-3h-2.5a.755.755 0 0 1-.75-.75.755.755 0 0 1 .75-.75h2.5a.755.755 0 0 1 .75.75.755.755 0 0 1-.75.75Z"
        fill={props.fill}
      />
    </G>
  </Svg>
)
export default PresentCredential
