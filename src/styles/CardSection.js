import styled from 'styled-components/macro';

const CardSection = styled.div`
  color: #313131;
  width: var(--card-width);
  height: inherit;
  display: grid;
  grid-template-rows: var(--selected-img-height) auto 1fr;
  gap: 0.5rem;
  place-items: center;
  &:not(.preloader-card) > div {
    border: var(--debug-boxes);
    height: 100%;
    justify-self: stretch;
    &:first-child {
      position: relative;
    }
  }
  & img {
    height: 100%;
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
  }
  .paragraph {
    text-overflow: ellipsis;
  }
`;

export default CardSection;
