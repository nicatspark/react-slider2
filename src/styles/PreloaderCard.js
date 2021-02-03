import styled from 'styled-components/macro';
import CardSection from './CardSection';

const PreloaderCard = styled(CardSection)`
  width: var(--card-width);
  margin-right: 100px;
  & > div {
    width: var(--card-width);
    border-radius: 5px;
    &:first-child {
      width: calc(var(--card-width) + 100px);
      height: 100%;
      position: relative;
    }
    &:last-child {
      height: 100%;
    }
  }
`;

export default PreloaderCard;
