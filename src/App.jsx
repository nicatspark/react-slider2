import React from 'react';
import './App.scss';
import Slider from './Slider';

function App() {

  return (
    <div className="App">
      <div className="pancake-grid">
        <header>
          <h1>Configurator</h1>
        </header>
        <article>
          <Slider />
        </article>
      </div>
      
    </div>
  );
}

export default App;
