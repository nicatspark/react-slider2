import styled from 'styled-components/macro';

const CardWrapper = styled.div`
  position: relative;
  display: inline-grid;
  gap: var(--card-gap);
  grid-auto-flow: column;
  will-change: transform;
  transform-origin: center;
  left: var(--card-center-offset);
  opacity: 1;
  transition: opacity 400ms linear;
  &.transparent {
    opacity: 0;
    transition: none;
  }
`;

export default CardWrapper;
