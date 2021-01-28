import styled from 'styled-components';
import LoadingIcon from './LoadingIcon';

const SelectedOption = styled.div`
  position: absolute;
  top: calc(var(--header-height) + var(--slider-vertical-padding));
  width: 100vw;
  border: var(--debug-boxes);
  height: var(--selected-img-height);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  pointer-events: none;
  img {
    height: 100%;
  }
`;

const LoadingIconStyled = styled(LoadingIcon)`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
`;

export { SelectedOption, LoadingIconStyled };
