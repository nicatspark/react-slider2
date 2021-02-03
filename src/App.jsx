import React from 'react';
import Slider from './components/SldrCmpnt/Slider';
import GlobalStyle from './GlobalStyles';
import { PancakeGrid, Log } from './components/SldrCmpnt/styles';

function App() {
  return (
    <>
      <GlobalStyle />
      <div className="App" style={{ height: '100vh' }}>
        <PancakeGrid>
          <header>
            <h1>Configurator</h1>
          </header>
          <div className="content-frame backdrop">
            <Slider />
          </div>
        </PancakeGrid>
        <Log className="log"></Log>
      </div>
    </>
  );
}

export default App;
