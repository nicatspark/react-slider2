import styled from 'styled-components/macro';

const PancakeGrid = styled.div`
  display: grid;
  grid-template-rows: var(--header-height) 1fr;
  height: 100%;
  header {
    background-color: #111111;
    color: #222;
    padding: 30px;
    display: grid;
    place-items: center;
    h1 {
      margin: 0;
    }
  }
  div.content-frame {
    overflow: hidden;
    height: calc(100vh - var(--header-height));
    padding: var(--slider-vertical-padding) 0;
  }
`;

export default PancakeGrid;
