import React from 'react'
import Svg, { G, Path, SvgProps } from 'react-native-svg'

const PersonAdd: React.FC<SvgProps> = props => (
  <Svg width={23.54} height={23.54} viewBox="0 0 23.54 23.54" {...props}>
    <G data-name="Group 1470" fill="none">
      <Path data-name="Rectangle 991" d="M0 0h23.54v23.54H0z" />
      <Path data-name="Rectangle 992" d="M0 0h23.54v23.54H0z" />
    </G>
    <G data-name="Group 1472" fill={props.fill}>
      <Path
        data-name="Path 546"
        d="M21.54 8.77v-1a1 1 0 0 0-1-1 1 1 0 0 0-1 1v1h-1a1 1 0 0 0-1 1 1 1 0 0 0 1 1h1v1a1 1 0 0 0 1 1 1 1 0 0 0 1-1v-1h1a1 1 0 0 0 1-1 1 1 0 0 0-1-1Z"
      />
      <G data-name="Group 1471">
        <Path data-name="Path 547" d="M7.847 11.77a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z" />
        <Path data-name="Path 548" d="M8 12.77c-2.67 0-8 1.34-8 4v3h16v-3c0-2.66-5.33-4-8-4Z" />
        <Path data-name="Path 549" d="M12.161 3.82a5.981 5.981 0 0 1 0 7.9 3.98 3.98 0 0 0 0-7.9Z" />
        <Path
          data-name="Path 550"
          d="M16.07 13.6a4.237 4.237 0 0 1 1.47 3.17v3h2v-3c0-1.45-1.59-2.51-3.47-3.17Z"
        />
      </G>
    </G>
  </Svg>
)

export default PersonAdd
