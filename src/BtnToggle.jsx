import { useState } from 'react';
import styled from 'styled-components';

const ZoomToggle = styled.div`
  --size: 7em;
  position: fixed;
  left: calc(var(--size) / -2);
  bottom: calc(var(--size) / -2);
  background-color: black;
  width: var(--size);
  height: var(--size);
  border-radius: 50%;
  transition: transform 500ms ease-in-out;
  transform: rotate(0deg);
  transform-origin: center center;
  cursor: pointer;
  &.active {
    transform: rotate(-90deg);
  }
  &:hover i {
    &.fa-search-minus {
      transform: translate(-50%, -50%) scale(1.5);
    }
    &.fa-search-plus {
      transform: translate(-50%, -50%) scale(1.5) rotate(90deg);
    }
  }
  i {
    color: rgba(255, 255, 255, 1);
    position: absolute;
    transition: transform 200ms ease-out;
    &.fa-search-minus {
      left: 70%;
      top: 30%;
      transform: translate(-50%, -50%);
    }
    &.fa-search-plus {
      left: 70%;
      top: 70%;
      transform: translate(-50%, -50%) rotate(90deg);
    }
  }
`;
ZoomToggle.displayName = 'BtnToggle';

export default function BtnToggle({ toggleZoomInOut }) {
  const [active, setActive] = useState(false);

  function toggle() {
    toggleZoomInOut();
    setActive(!active);
  }

  return (
    <ZoomToggle
      className={`zoom-toggle ${active ? 'active' : ''}`}
      onClick={() => toggle()}
    >
      <i className="fas fa-search-minus"></i>
      <i className="fas fa-search-plus"></i>
    </ZoomToggle>
  );
}
