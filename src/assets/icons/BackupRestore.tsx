import React from 'react'
import Svg, { G, Path, SvgProps } from 'react-native-svg'

const BackupRestore: React.FC<SvgProps> = props => (
  <Svg width={24} height={24} viewBox="0 0 24 24" {...props}>
    <G data-name="Group 1849">
      <Path data-name="Rectangle 4034" fill="none" d="M0 0h24v24H0z" />
    </G>
    <G data-name="Group 1851">
      <G data-name="Group 1850">
        <Path
          data-name="Path 617"
          d="M19.299 14.826a.089.089 0 0 0-.049.01 3.448 3.448 0 0 0-6.542-.96 2.961 2.961 0 0 0 .158 5.919l6.433-.02a2.474 2.474 0 0 0 0-4.949ZM7.917 4.216v2.069a5.9 5.9 0 0 0-1.979 9.986v-2.412h1.979v5.938H1.979v-1.982h2.7a7.9 7.9 0 0 1 3.236-13.6Zm9.9 1.722h-2.7a7.9 7.9 0 0 1 2.633 4.949h-2a5.942 5.942 0 0 0-1.89-3.4v2.41h-1.981V3.959h5.938Z"
          fill={props.fill}
        />
      </G>
    </G>
  </Svg>
)

export default BackupRestore
