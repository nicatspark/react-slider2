import { useEffect, useState } from 'react';
import motionBlur from './motion-blur-move';
import './App.scss';

async function initiate() {
  await adjustCardSpacing();
  return new Promise((resolve) => {
    resetCardsPos();
    addListeners();
    resolve();
  });
}

function adjustCardSpacing() {
  return new Promise((resolve) => {
    const { firstImage } = viewModel();
    firstImage.addEventListener('load', _distributeCards);

    function _distributeCards(e) {
      const imgWidth = e.target.getBoundingClientRect().width;
      const sliderWrapper = document.querySelector('article');
      const cardWidth = parseInt(
        window.getComputedStyle(sliderWrapper).getPropertyValue('--card-width')
      );
      const imageOverflow = (imgWidth - cardWidth) / 2;
      console.log('imageOverflow', imageOverflow);
      const cardSpacing = false
        ? window.innerWidth / 2 - imgWidth / 2
        : imgWidth / 2 + 20 + imageOverflow;
      sliderWrapper.style.setProperty('--card-gap', `${cardSpacing}px`);
      // debugger;
      // const root = window.getComputedStyle(document.querySelector(':root'));
      // root.setProperty('--card-gap', imgWidth / 2 + gawBetween);
      resolve();
    }
  });
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
  // cardsWrapper.style.left = global.CARD_CENTER_OFFSET * -1 + 'px';
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
  const endValue = global.DIST_BTWN_CARDS * index * -1;
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
    blurMultiplier: 0.2,
  }).then(({ element }) => console.log('done', element));

  // cardsWrapper.style.transform = `translateX(${
  //   (offsetLeft + global.CARD_CENTER_OFFSET) * -1
  // }px)`;
}

let global = {
  CARD_CENTER_OFFSET: 0,
  DIST_BTWN_CARDS: 200,
};
Object.freeze(global);

function resetCardsPos() {
  const { cardsCollection, cardsWrapper, stateUpdate } = viewModel();
  const cardStyles = cardsCollection[0].getBoundingClientRect();
  const CARD_CENTER_OFFSET = Math.round(cardStyles.width / 2);
  const DIST_BTWN_CARDS =
    cardsCollection[1].getBoundingClientRect().x - cardStyles.x;
  cardsWrapper.style.left = `${global.CARD_CENTER_OFFSET * -1}px`;
  stateUpdate({
    DIST_BTWN_CARDS,
    CARD_CENTER_OFFSET,
  });
}

function viewModel() {
  const cardsCollection = document.querySelectorAll('.card-section');
  const cardsWrapper = cardsCollection[0] && cardsCollection[0].parentElement;
  const firstImage = cardsCollection[0].querySelector('img');
  // Mini state.
  const _stateKeyExist = (keyValueObj) =>
    Object.keys(keyValueObj)
      .map((key) => !!global[key])
      .some(Boolean);
  const stateUpdate = (keyValueObj) => (global = { ...global, ...keyValueObj });
  const stateAdd = (keyValueObj) =>
    !_stateKeyExist(keyValueObj)
      ? stateUpdate(keyValueObj)
      : console.error(`One or more keys already existed in state.`);
  return {
    cardsCollection,
    cardsWrapper,
    firstImage,
    stateUpdate,
    stateAdd,
  };
}

function App() {
  const [options] = useState([
    'header1',
    'header2',
    'header3',
    'header4',
    'header5',
  ]);

  useEffect(() => {
    const init = async () => {
      await initiate();
      console.log('React inited');
    };
    init();
  }, []);

  return (
    <div className="App">
      <div className="pancake-grid">
        <header>
          <h1>Configurator</h1>
        </header>
        <article>
          <section className="card-container">
            <div className="card-wrapper">
              {options.map((o, i) => (
                <div key={i} className="card-section center" data-index={i}>
                  <div className="image">
                    <img src="https://via.placeholder.com/500" alt="" />
                  </div>
                  <div className="header">
                    <h4>{o}</h4>
                  </div>
                  <div className="paragraph">
                    Lorem ipsum dolor sit amet consectetur adipisicing elit.
                    Accusantium quidem nostrum veritatis odio, maiores quasi?
                  </div>
                </div>
              ))}
            </div>
          </section>
        </article>
      </div>
    </div>
  );
}

export default App;
