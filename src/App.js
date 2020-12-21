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
    firstImage.addEventListener('load', (e) => {
      console.log('e', e);
      const imgWidth = e.target.getBoundingClientRect().width;
      // const gapBetween = 10;
      const article = document.querySelector('article');
      article.style.setProperty(
        '--card-gap',
        `${window.innerWidth / 2 - imgWidth / 2}px`
      );
      console.log('cardgap', article.style.getPropertyValue('--card-gap'));
      // debugger;
      // const root = window.getComputedStyle(document.querySelector(':root'));
      // root.setProperty('--card-gap', imgWidth / 2 + gawBetween);
      resolve();
    });
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
    easing: 'easeOutQuad',
    useMotionBlur: true,
    blurMultiplier: 1,
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
  cardsWrapper.style.left = `${cardCenterOffset * -1}px`;
}

function viewModel() {
  const cardsCollection = document.querySelectorAll('.card-section');
  const cardsWrapper = cardsCollection[0] && cardsCollection[0].parentElement;
  const firstImage = cardsCollection[0].querySelector('img');
  return {
    cardsCollection,
    cardsWrapper,
    firstImage,
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
                  <div className="header">{o}</div>
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
