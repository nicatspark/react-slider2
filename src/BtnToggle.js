import React from 'react';
import styled from 'styled-components';

const ZoomToggle = styled.div`
  --border-style: 1px solid white;
  --width: 2em;
  --height: calc(var(--width) / 2);
  --frame-padding: calc(var(--height) / 6);
  --knob-size: calc(var(--height) - var(--frame-padding) * 2);
  position: absolute;
  left: 0;
  bottom: 0;
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  div.frame {
    position: relative;
    display: flex;
    align-items: center;
    margin: 0.5em;
    width: var(--width);
    height: var(--height);
    border-radius: calc(var(--height) / 2);
    border: var(--border-style);
    padding: 1px;
    cursor: pointer;
    background-color: rgba(255, 255, 255, 0);
    &.active {
      background-color: rgba(255, 255, 255, 0.5);
      div.knob {
        left: calc(var(--width) - var(--height));
        background-color: rgba(255, 255, 255, 0.9);
      }
    }
    div.knob {
      position: relative;
      left: 0;
      width: var(--knob-size);
      height: var(--knob-size);
      transition: left 0.4s linear;
      border: var(--border-style);
      border-radius: calc(var(--knob-size) / 2);
    }
  }
  label {
    opacity: 1;
    white-space: nowrap;
    color: white;
    text-transform: uppercase;
    font-size: 0.7em;
  }
`;
ZoomToggle.displayName = 'BtnToggle';

export default function BtnToggle() {
  return (
    <ZoomToggle>
      <div className="frame">
        <div className="knob"></div>
      </div>
      <label>Zoom out</label>
    </ZoomToggle>
  );
}
