import React from 'react'
import Svg, { G, Path, SvgProps } from 'react-native-svg'

const DoubleCheckMark: React.FC<SvgProps> = (props) => (
  <Svg width={17} height={12} viewBox="0 0 17 12" {...props}>
    <G data-name="Group 1361">
      <Path data-name="Path 427" d="M5 0h12v12H5Z" fill="none" />
      <Path
        data-name="Path 428"
        d="M11 1a5 5 0 1 0 5 5 5 5 0 0 0-5-5Zm0 9a4 4 0 1 1 4-4 4.005 4.005 0 0 1-4 4Zm1.94-5.855L10 7.085l-.94-.94a.5.5 0 0 0-.7.7l1.3 1.295a.5.5 0 0 0 .7 0l3.29-3.29a.5.5 0 0 0 0-.7.5.5 0 0 0-.71 0Z"
        fill={props.fill}
      />
      <Path
        data-name="Subtraction 1"
        d="M5 11a5 5 0 1 1 1.563-9.75 6.555 6.555 0 0 0-.751.834 4 4 0 1 0 0 7.834 6.555 6.555 0 0 0 .751.834A4.989 4.989 0 0 1 5 11ZM4 8.291a.5.5 0 0 1-.352-.146l-1.3-1.3a.5.5 0 1 1 .705-.7l.94.94.524-.524a6.5 6.5 0 0 0 .217 1.2l-.386.386A.5.5 0 0 1 4 8.291Z"
        fill={props.fill}
      />
    </G>
  </Svg>
)

export default DoubleCheckMark
