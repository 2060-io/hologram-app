import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

const CloudDownload: React.FC<SvgProps> = (props) => (
  <Svg viewBox="0 0 56 56" {...props}>
    <Path data-name="Trazado 663" d="M0 0h56v56H0z" fill="none" />
    <Path
      data-name="Trazado 664"
      d="M45.15 17.574A17.322 17.322 0 0028 4a17.58 17.58 0 00-15.517 9.08A13.669 13.669 0 000 26.474a13.76 13.76 0 0014 13.485h30.333A11.462 11.462 0 0056 28.722a11.369 11.369 0 00-10.85-11.148zm-12.483 6.653v8.99h-9.334v-8.99h-7l10.85-10.45a1.186 1.186 0 011.657 0l10.827 10.45z"
      transform="translate(0 6.021)"
      fill={props.fill}
    />
  </Svg>
)

export default CloudDownload
