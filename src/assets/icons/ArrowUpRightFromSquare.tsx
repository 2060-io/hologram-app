import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

const ArrowUpRightFromSquare: React.FC<SvgProps> = (props) => (
  <Svg viewBox="0 0 15.474 15.613" {...props}>
    <Path
      d="M9.354 4.88H7.786a4.285 4.285 0 00-1.836.192 1.75 1.75 0 00-.761.769A4.418 4.418 0 005 7.7v6.688a4.414 4.414 0 00.19 1.855 1.751 1.751 0 00.761.769 4.277 4.277 0 001.833.192h6.622a4.274 4.274 0 001.832-.192 1.753 1.753 0 00.762-.77 4.407 4.407 0 00.19-1.852V12.8m.871-4.4V4m0 0h-4.354m4.353 0l-6.095 6.16"
      fill="none"
      stroke={props.fill}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      transform="translate(-4 -2.586)"
      data-name="Interface / External_Link"
    />
  </Svg>
)

export default ArrowUpRightFromSquare
