import React from 'react'
import Svg, { G, Path, SvgProps } from 'react-native-svg'

const Edit: React.FC<SvgProps> = (props) => (
  <Svg viewBox="0 0 23.54 23.54" {...props}>
    <G data-name="Group 1476">
      <Path data-name="Rectangle 994" fill="none" d="M0 0h23.54v23.54H0z" />
    </G>
    <G data-name="Group 1480">
      <G data-name="Group 1479">
        <G data-name="Group 1477">
          <Path
            fill={props.fill}
            data-name="Path 562"
            d="M3 17v3.04a.5.5 0 0 0 .5.5h3.04a.469.469 0 0 0 .35-.15L17.81 9.48l-3.75-3.75L3.15 16.64A.491.491 0 0 0 3 17Z"
          />
        </G>
        <G data-name="Group 1478">
          <Path
            fill={props.fill}
            data-name="Path 563"
            d="m20.25 5.63-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83a1 1 0 0 0 0-1.41Z"
          />
        </G>
      </G>
    </G>
  </Svg>
)

export default Edit
