import { memo } from 'react';
import styled from 'styled-components';

const ClickMarkerDiv = styled.div`
  position: fixed;
  top: ${window.innerHeight / 2}px;
  left: ${window.innerWidth / 2}px;
  width: 1px;
  height: 1px;
  pointer-events: none;
  div {
    --transition-time: 500ms;
    position: absolute;
    transform-origin: center;
    transform: translate(-50%, -50%) scale(1);
    transition: transform var(--transition-time) ease-out,
      opacity var(--transition-time) ease-out,
      border-width var(--transition-time) cubic-bezier(0.25, 0.46, 0.45, 0.94);
    border-width: 1px;
    opacity: 0;
    filter: blur(10px);
    width: 200px;
    height: 200px;
    border-radius: 50%;
    border-color: white;
    border-style: solid;
  }
  &.active div {
    transform: translate(-50%, -50%) scale(0.1);
    border-width: 50px;
    opacity: 0.5;
    transition: none;
  }
`;

const ClickMarker = () => {
  console.log('CLick marker rendered');
  return (
    <ClickMarkerDiv className="click-marker">
      <div></div>
    </ClickMarkerDiv>
  );
};

export default memo(ClickMarker);
