import styled from 'styled-components/macro';

const CardContainer = styled.div`
  display: grid;
  /* center wrapper old school way */
  width: 1px;
  height: 100%;
  margin: 0 auto;
  transform: scale(1);
  transition: transform 400ms ease-in-out;
  &.zoomed-out {
    transform: scale(0.4);
  }
`;

export default CardContainer;
