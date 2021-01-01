import { useState } from 'react';
import './App.scss';
import Slider from './Slider';
import BtnToggle from './BtnToggle';

function App() {
  const [zoomedOut, setZoomedOut] = useState(false);

  const toggleZoomInOut = () => setZoomedOut(!zoomedOut);

  return (
    <div className="App">
      <div className="pancake-grid">
        <header>
          <h1>Configurator</h1>
        </header>
        <article>
          <Slider zoomedOut={zoomedOut} />
        </article>
      </div>
      <BtnToggle toggleZoomInOut={toggleZoomInOut}></BtnToggle>
    </div>
  );
}

export default App;
