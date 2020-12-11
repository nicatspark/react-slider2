import { useEffect } from 'react';
// import motionBlur from './motion-blur-move';
import './App.scss';

function initiate() {
  resetCardsPos();
  addListeners();
}

function addListeners() {
  window.addEventListener('click', handleClick);
}

function handleClick(e) {
  const cardClick = e.target.closest('.card-section');
  if (!cardClick) return;
  console.dir(cardClick);
  slideCards(cardClick && cardClick.offsetLeft);
}

function slideCards(offsetLeft) {
  const { cardsWrapper } = viewModel();
  cardsWrapper.style.transform = `translateX(${
    (offsetLeft + cardCenterOffset) * -1
  }px)`;
}

let cardCenterOffset;
function resetCardsPos() {
  const { cardsCollection } = viewModel();
  const cardStyles = window.getComputedStyle(cardsCollection[0]);
  cardCenterOffset = Math.round(parseInt(cardStyles.width) / 2);
  slideCards(0);
  // cardsWrapper.style.transform = `translateX(${cardCenterOffset * -1}px)`;
}

function viewModel() {
  const cardsCollection = document.querySelectorAll('.card-section');
  const cardsWrapper = cardsCollection[0] && cardsCollection[0].parentElement;
  return {
    cardsCollection,
    cardsWrapper,
  };
}
// window.onload = initiate;

function App() {
  useEffect(() => {
    initiate();
  }, []);

  return (
    <div className="App">
      <section className="card-container">
        <div className="card-wrapper">
          <div className="card-section center">1</div>
          <div className="card-section center">2</div>
          <div className="card-section center">3</div>
        </div>
      </section>
    </div>
  );
}

export default App;
