import React from 'react';
import './App.scss';
import Slider from './Slider';
import styled from 'styled-components';

const Log = styled.div`
  position: fixed;
  background: white;
  width: 100vw;
  height: 100px;
  overflow-x: auto;
  overflow-y: scroll;
  top: 0;
  left: 0;
  font-size: 0.7rem;
  mix-blend-mode: exclusion;
`;

function App() {
  return (
    <div className="App">
      <div className="pancake-grid">
        <header>
          <h1>Configurator</h1>
        </header>
        <div className="content-frame">
          <Slider />
        </div>
      </div>
      <Log className="log"></Log>
    </div>
  );
}

export default App;
