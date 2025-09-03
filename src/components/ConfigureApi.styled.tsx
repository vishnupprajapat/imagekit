import {styled} from 'styled-components'

import ImageKitLogo from './ImageKitLogo'

const Logo = styled.span`
  display: inline-block;
  height: 0.8em;
  margin-right: 1em;
  transform: translate(0.3em, -0.2em);
`

export const Header = () => (
  <>
    <Logo>
      <ImageKitLogo />
    </Logo>
    API Credentials
  </>
)
