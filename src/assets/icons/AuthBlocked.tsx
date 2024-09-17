import React from 'react'
import Svg, { G, Path, SvgProps } from 'react-native-svg'

const AuthBlocked: React.FC<SvgProps> = props => (
  <Svg width={19} height={22} viewBox="0 0 19 22" {...props}>
    <G data-name="Group 1844">
      <G data-name="Group 1843" fill={props.fill}>
        <Path
          data-name="Path 614"
          d="M14 10a6.908 6.908 0 0 1 2 .29V9a2.006 2.006 0 0 0-2-2h-1V5A5 5 0 0 0 3 5v2H2a2.006 2.006 0 0 0-2 2v10a2.006 2.006 0 0 0 2 2h6.26A7 7 0 0 1 14 10ZM4.9 5a3.1 3.1 0 0 1 6.2 0v2H4.9Z"
        />
        <Path
          data-name="Path 615"
          d="M14 12a5 5 0 1 0 5 5 5 5 0 0 0-5-5Zm0 2a1.5 1.5 0 1 1-1.5 1.5A1.5 1.5 0 0 1 14 14Zm0 6a2.985 2.985 0 0 1-2.48-1.32 4.862 4.862 0 0 1 4.96 0A2.985 2.985 0 0 1 14 20Z"
        />
      </G>
    </G>
  </Svg>
)

export default AuthBlocked
