import { useEffect, useState, useRef } from 'react';
import BtnToggle from './BtnToggle.jsx';
import Portal from './Portal';
import motionBlur from './utils/motion-blur-move';
import microState from './utils/microState';
import preloadImages from './utils/preloadImages';
// import Hammer from 'hammerjs';

window.global = Object.freeze({
  CARD_CENTER_OFFSET: { current: 0, unit: 'px', css: true },
  CARD_GAP: { current: 100, unit: 'px', css: true },
  CARD_SCROLL_DISTANCE: { current: 400, unit: 'px', css: true },
  CARD_WIDTH: { current: 300, unit: 'px', css: false },
  IMG_WIDTH: { current: 300, unit: 'px', css: false },
  CARD_IMG_SPACING: { current: 20, unit: 'px', css: false },
  SELECTED_INDEX: { current: 0, unit: '', css: false },
  CARDS_MOVING: { current: 0, unit: '', css: false },
  CARDS: { current: [], unit: '', css: false },
});

async function initiate() {
  await adjustCardSpacing();
  return new Promise((resolve) => {
    resetCardsPos();
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
      const imageOverflow = (IMG_WIDTH - CARD_WIDTH) / 2;
      const CARD_IMG_SPACING = parseInt(
        rootStyle.getPropertyValue('--card-img-spacing')
      );
      const CARD_GAP = CARD_IMG_SPACING + imageOverflow * 2; // parseInt(rootStyle.getPropertyValue('--card-gap'));
      const CARD_SCROLL_DISTANCE =
        CARD_WIDTH + imageOverflow * 2 + CARD_IMG_SPACING;
      SET({
        IMG_WIDTH,
        CARD_WIDTH,
        CARD_GAP,
        CARD_SCROLL_DISTANCE,
        CARD_IMG_SPACING,
      });
      resolve();
    }
  });
}

function resetCardsPos() {
  const { SET, STATE } = stateGuiMediator();
  const { CARD_WIDTH } = STATE;
  // const cardStyles = cardsCollection[0].getBoundingClientRect();
  const CARD_CENTER_OFFSET = Math.round(CARD_WIDTH / -2);
  // const CARD_SCROLL_DISTANCE =
  //   cardsCollection[1].getBoundingClientRect().x - cardStyles.x;
  SET({
    CARD_CENTER_OFFSET,
  });
  console.table(STATE);
}

function handleClick(e) {
  const { SET } = stateGuiMediator();
  const selectedCard = e.target.closest('.card-section');
  if (!selectedCard) return;
  const { index } = selectedCard.dataset;
  SET({ SELECTED_INDEX: index });
  // cardsWrapper.style.left = global.CARD_CENTER_OFFSET * -1 + 'px';
  slideCards({ selectedCard, index }).then(() => console.log('#######'));
}

function slideCards({ selectedCard, index }) {
  const { cardsWrapper, cardsCollection, SET, STATE } = stateGuiMediator();
  _setState({ selectedCard, index });
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

  return motionBlur(cardsWrapper, {
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
  function _setState({ selectedCard, index }) {
    let CARDS_MOVING = 0;
    if (selectedCard > STATE.SELECTED_INDEX) CARDS_MOVING = 1;
    if (selectedCard > STATE.SELECTED_INDEX) CARDS_MOVING = -1;
    SET({ SELECTED_INDEX: index, CARDS_MOVING });
  }
}

function stateGuiMediator() {
  const cardsCollection = document.querySelectorAll('.card-section');
  const cardsWrapper = cardsCollection[0] && cardsCollection[0].parentElement;
  const firstImage = cardsCollection[0].querySelector('img');
  const documentRoot = document.documentElement;
  const cardContainer = document.querySelector('.card-container');
  // Micro state helper functions.
  const { ADD, SET, STATE } = microState();
  return {
    cardsCollection,
    cardsWrapper,
    cardContainer,
    firstImage,
    documentRoot,
    ADD,
    SET,
    STATE,
  };
}

function fetchApi() {
  const { SET } = stateGuiMediator();
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
      SET({ CARDS: cardsArr });
      resolve(cardsArr);
    }, 2000);
  });
}

const handleGestures = (e, setZoomedOut) => {
  const { STATE } = stateGuiMediator();
  e.preventDefault();
  if (e.ctrlKey) {
    setZoomedOut(!!Math.max(0, e.deltaY));
  } else {
    if (e.deltaX < 0 || Math.abs(STATE.CARDS_MOVING) !== 0) return;
    console.log('PAN', e.deltaX);
    if (e.deltaX < 0) {
      // previous card.
      const nextSelectedIndex = Math.max(0, STATE.SELECTED_INDEX - 1);
      slideCards({ selectedIndex: nextSelectedIndex });
    } else {
      // Next card.
      const nextSelectedIndex = Math.min(
        STATE.CARDS.length - 1,
        STATE.SELECTED_INDEX + 1
      );
      slideCards({ selectedIndex: nextSelectedIndex });
    }
  }
};

function Slider() {
  console.log('rendered');
  const [options, setOptions] = useState([]);
  const [preloading, setPreloading] = useState(true);
  const [hideSlider, setHideSlider] = useState(false);
  const cardContainer = useRef();
  const [zoomedOut, setZoomedOut] = useState(false);

  const toggleZoomInOut = () => setZoomedOut(!zoomedOut);

  useEffect(() => {
    const init = async () => {
      const cardsArr = await fetchApi();
      await preloadImages(cardsArr);
      setPreloading(false);
      setHideSlider(true);
      // setImageSource(cardsArr);
      setOptions(cardsArr);
      await initiate();
      setHideSlider(false);
      console.log('React inited');
    };
    init();
  }, [setOptions]);

  useEffect(() => {
    const el = cardContainer.current;
    el.addEventListener('wheel', (e) => handleGestures(e, setZoomedOut));
    window.addEventListener('click', handleClick);
    return () => {
      el.removeEventListener('wheel', (e) => handleGestures(e, setZoomedOut));
      window.removeEventListener('click', handleClick);
    };
  }, [zoomedOut]);

  return (
    <section
      ref={cardContainer}
      className={`card-container${preloading ? ' ispreloading' : ''}${
        zoomedOut ? ' zoomed-out' : ''
      }`}
    >
      <div className={`card-wrapper${hideSlider ? ' transparent' : ''}`}>
        {!preloading ? (
          options.map((o, i) => (
            <div key={i} className="card-section center" data-index={i}>
              <div className="image">
                <img src={o.imageUrl} alt={o.header} />
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
      <Portal>
        <BtnToggle toggleZoomInOut={toggleZoomInOut}></BtnToggle>
      </Portal>
    </section>
  );
}

export default Slider;
