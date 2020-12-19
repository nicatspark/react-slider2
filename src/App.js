import { useEffect, useState } from 'react';
import motionBlur from './motion-blur-move';
import './App.scss';

function initiate() {
  resetCardsPos();
  addListeners();
}

function addListeners() {
  window.addEventListener('click', handleClick);
}

function handleClick(e) {
  // const { cardsWrapper } = viewModel();
  const selectedCard = e.target.closest('.card-section');
  if (!selectedCard) return;
  const { index } = selectedCard.dataset;
  console.log(selectedCard, e);
  // cardsWrapper.style.left = cardCenterOffset * -1 + 'px';
  slideCards(selectedCard, index);
}

function slideCards(selectedCard, index) {
  const { cardsWrapper } = viewModel();
  const cardsWrapperStyles = window.getComputedStyle(cardsWrapper);
  // const cardsWrapperBoundaries = cardsWrapper.getBoundingClientRect();
  // eslint-disable-next-line
  const regexParentesisContent = /\(([^\)]*)\)/;
  const startValue =
    window.getComputedStyle(cardsWrapper).transform !== 'none'
      ? Math.round(
          cardsWrapperStyles.transform
            .match(regexParentesisContent)[1]
            .split(',')[4]
        )
      : 0;
  const endValue = distBtwnCards * index * -1;
  console.log(startValue, endValue);

  motionBlur(cardsWrapper, {
    durationMs: 250,
    properties: [
      {
        property: 'transform',
        start: `translateX(${startValue}px)`,
        end: `translateX(${endValue}px)`,
      },
    ],
    applyToggle: false,
    easing: 'easeOutBack',
    useMotionBlur: true,
    blurMultiplier: 0.5,
  }).then(({ element }) => console.log('done', element));

  // cardsWrapper.style.transform = `translateX(${
  //   (offsetLeft + cardCenterOffset) * -1
  // }px)`;
}

let cardCenterOffset;
let distBtwnCards;
function resetCardsPos() {
  const { cardsCollection, cardsWrapper } = viewModel();
  const cardStyles = cardsCollection[0].getBoundingClientRect();
  cardCenterOffset = Math.round(cardStyles.width / 2);
  distBtwnCards = cardsCollection[1].getBoundingClientRect().x - cardStyles.x;
  debugger;
  // slideCards(0);
  cardsWrapper.style.left = `${cardCenterOffset * -1}px`;
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
  const [options] = useState([
    'header1',
    'header2',
    'header3',
    'header4',
    'header5',
  ]);

  useEffect(() => {
    initiate();
  }, []);

  return (
    <div className="App">
      <section className="card-container">
        <div className="card-wrapper">
          {options.map((o, i) => (
            <div key={i} className="card-section center" data-index={i}>
              1 {o}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default App;
