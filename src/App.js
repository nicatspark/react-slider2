import { useEffect, useState, useRef } from 'react';
import motionBlur from './motion-blur-move';
import microState from './microState';
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
  const { SET } = stateGuiMediator();
  return new Promise((resolve) => {
    const { firstImage, documentRoot } = stateGuiMediator();
    firstImage.addEventListener('load', _distributeCards);

    function _distributeCards(e) {
      const IMG_WIDTH = e.target.getBoundingClientRect().width;
      const rootStyle = window.getComputedStyle(documentRoot);
      const CARD_WIDTH = parseInt(rootStyle.getPropertyValue('--card-width'));
      const CARD_GAP = parseInt(rootStyle.getPropertyValue('--card-gap'));
      const imageOverflow = (IMG_WIDTH - CARD_WIDTH) / 2;
      // TODO: this is not scroll distance.
      const CARD_SCROLL_DISTANCE = CARD_GAP + imageOverflow * 2;
      SET({ IMG_WIDTH, CARD_WIDTH, CARD_GAP, CARD_SCROLL_DISTANCE });
      resolve();
    }
  });
}

function resetCardsPos() {
  const { cardsCollection, SET, STATE } = stateGuiMediator();
  const { CARD_WIDTH } = STATE;
  const cardStyles = cardsCollection[0].getBoundingClientRect();
  const CARD_CENTER_OFFSET = Math.round(CARD_WIDTH / -2);
  const CARD_SCROLL_DISTANCE =
    cardsCollection[1].getBoundingClientRect().x - cardStyles.x;
  SET({
    CARD_SCROLL_DISTANCE,
    CARD_CENTER_OFFSET,
  });
  console.table(window.global);
}

function addListeners() {
  window.addEventListener('click', handleClick);
}

function handleClick(e) {
  // const { cardsWrapper } = stateGuiMediator();
  const selectedCard = e.target.closest('.card-section');
  if (!selectedCard) return;
  const { index } = selectedCard.dataset;
  console.log(selectedCard, e);
  // cardsWrapper.style.left = global.CARD_CENTER_OFFSET * -1 + 'px';
  slideCards(selectedCard, index);
}

function slideCards(selectedCard, index) {
  const { cardsWrapper, cardsCollection, STATE } = stateGuiMediator();
  const cardsWrapperStyles = window.getComputedStyle(cardsWrapper);
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
  const endValue = STATE.CARD_SCROLL_DISTANCE * index * -1;
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
    blurMultiplier: 0.2,
  }).then(({ element }) => {
    console.log('done', element, selectedCard);
    [...cardsCollection].forEach((card) => {
      card.classList.remove('selected');
    });
    cardsCollection[index].classList.add('selected');
  });
}

window.global = Object.freeze({
  CARD_CENTER_OFFSET: { current: 0, unit: 'px', css: true },
  CARD_GAP: { current: 100, unit: 'px', css: true },
  CARD_SCROLL_DISTANCE: { current: 400, unit: 'px', css: true },
  CARD_WIDTH: { current: 300, unit: 'px', css: false },
  IMG_WIDTH: { current: 300, unit: 'px', css: false },
});

function stateGuiMediator() {
  const cardsCollection = document.querySelectorAll('.card-section');
  const cardsWrapper = cardsCollection[0] && cardsCollection[0].parentElement;
  const firstImage = cardsCollection[0].querySelector('img');
  const documentRoot = document.documentElement;
  // Micro state helper functions.
  const { ADD, SET, STATE } = microState();
  return {
    cardsCollection,
    cardsWrapper,
    firstImage,
    documentRoot,
    ADD,
    SET,
    STATE,
  };
}

function fetchApi() {
  return new Promise((resolve) => {
    const tempUrl = 'https://source.unsplash.com/random/500x500';
    const cardsArr = [
      {
        header: 'header1',
        imageUrl: tempUrl,
      },
      {
        header: 'header2',
        imageUrl: tempUrl,
      },
      {
        header: 'header3',
        imageUrl: tempUrl,
      },
      {
        header: 'header4',
        imageUrl: tempUrl,
      },
      {
        header: 'header5',
        imageUrl: tempUrl,
      },
    ];
    setTimeout(() => {
      resolve(cardsArr);
    }, 2000);
  });
}

async function preloadImages(cards) {
  // load 1st image first, then the rest in parallel.
  console.assert(
    cards.map((c) => !!c.imageUrl).every(Boolean),
    'One or more card options lack imgurl.'
  );
  await addImageProcess(cards[0].imageUrl);
  return new Promise((resolve, reject) => {
    const loadArr = [...cards]
      .splice(1)
      .map((card) => addImageProcess(card.imageUrl));
    Promise.all(loadArr)
      .then((values) => {
        console.log('slider', 'Images loaded', values);
        resolve();
      })
      .catch(() => {
        reject('Problem loading images.');
      });
    resolve();
  });

  function addImageProcess(src) {
    return new Promise((resolve, reject) => {
      let img = new Image();
      img.onload = () => resolve(true);
      img.onerror = reject;
      img.src = src;
    });
  }
}

function App() {
  const [options, setOptions] = useState([]);
  const [preloading, setPreloading] = useState(true);
  const cardContainer = useRef(null);

  useEffect(() => {
    const init = async () => {
      const cardsArr = await fetchApi();
      await preloadImages(cardsArr);
      setPreloading(false);
      // setImageSource(cardsArr);
      setOptions(cardsArr);
      await initiate();
      console.log('React inited');
    };
    init();
  }, [setOptions]);

  // function setImageSource(cardsArr) {
  //   const allImgs = cardContainer.current.querySelectorAll('.image > img');
  //   debugger;
  //   [...allImgs].forEach((img, i) =>
  //     img.setAttribute('src', cardsArr[i].imageUrl)
  //   );
  // }

  return (
    <div className="App">
      <div className="pancake-grid">
        <header>
          <h1>Configurator</h1>
        </header>
        <article>
          <section
            ref={cardContainer}
            className={`card-container${preloading ? ' ispreloading' : ''}`}
          >
            <div className="card-wrapper">
              {!preloading ? (
                options.map((o, i) => (
                  <div key={i} className="card-section center" data-index={i}>
                    <div className="image">
                      <img src={o.imageUrl} alt="" />
                    </div>
                    <div className="header">
                      <h4>{o.header}</h4>
                    </div>
                    <div className="paragraph">
                      Lorem ipsum dolor sit amet consectetur adipisicing elit.
                      Accusantium quidem nostrum veritatis odio, maiores quasi?
                    </div>
                  </div>
                ))
              ) : (
                <div className="card-section center preloader-card">
                  <div className="image animated-background"></div>
                  <div className="header animated-background">
                    <h4>&nbsp;</h4>
                  </div>
                  <div className="paragraph animated-background">&nbsp;</div>
                </div>
              )}
            </div>
          </section>
        </article>
      </div>
    </div>
  );
}

export default App;
