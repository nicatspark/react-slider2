import styled from 'styled-components/macro';
import LoadingIcon from '../LoadingIcon';

const LoadingIconStyled = styled(LoadingIcon)`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
`;

export default LoadingIconStyled;
