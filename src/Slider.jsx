import { useEffect, useState, useRef } from 'react';
import BtnToggle from './BtnToggle.jsx';
import usePreventScroll from './utils/usePreventScroll';
import Portal from './Portal';
import motionBlur from './utils/motion-blur-move';
import microState from './utils/microState';
import preloadImages from './utils/preloadImages';
import _ from 'lodash';

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

const adjustCardSpacing = () => {
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
};

const resetCardsPos = () => {
  const { SET, STATE } = stateGuiMediator();
  const { CARD_WIDTH } = STATE;
  const CARD_CENTER_OFFSET = Math.round(CARD_WIDTH / -2);
  SET({ CARD_CENTER_OFFSET });
};

const slideCards = ({ nextIndex }) => {
  console.assert(
    !isNaN(nextIndex) && nextIndex >= 0,
    `Wrong argument passed to slideCards function.`
  );
  const index = parseInt(nextIndex);
  const { cardsWrapper, cardsCollection, SET, STATE } = stateGuiMediator();
  _setState({ index });
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
  //
  const isChrome =
    !!window.chrome && (!!window.chrome.webstore || !!window.chrome.runtime);
  const isEdgeChromium = isChrome && navigator.userAgent.indexOf('Edg') !== -1;
  const useMotionBlur = isChrome || isEdgeChromium;
  //
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
    useMotionBlur,
    blurMultiplier: 0.2,
  }).then(({ element }) => {
    SET({ CARDS_MOVING: 0 });
    _setSelectedCardIndex(index);
    console.log('done', element);
  });
  function _setState({ index }) {
    let CARDS_MOVING = 0;
    if (index > STATE.SELECTED_INDEX) CARDS_MOVING = 1;
    if (index < STATE.SELECTED_INDEX) CARDS_MOVING = -1;
    SET({ SELECTED_INDEX: index, CARDS_MOVING });
  }
  function _setSelectedCardIndex(index) {
    [...cardsCollection].forEach((card) => {
      card.classList.remove('selected');
    });
    cardsCollection[index].classList.add('selected');
  }
};

const stateGuiMediator = () => {
  const cardsCollection = document.querySelectorAll('.card-section');
  const cardsWrapper = cardsCollection[0] && cardsCollection[0].parentElement;
  const firstImage = cardsCollection[0].querySelector('img');
  const documentRoot = document.documentElement;
  const cardContainer = document.querySelector('.card-container');
  // Micro state helper functions.
  const { ADD, SET, STATE, SET_COMPLEX } = microState();
  return {
    cardsCollection,
    cardsWrapper,
    cardContainer,
    firstImage,
    documentRoot,
    ADD,
    SET,
    STATE,
    SET_COMPLEX,
  };
};

const fetchApi = () => {
  // const { SET } = stateGuiMediator();
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
      // SET({ CARDS: cardsArr });
      resolve(cardsArr);
    }, 2000);
  });
};

const setCardsToMicroState = (cards) => {
  const { SET_COMPLEX } = stateGuiMediator();
  SET_COMPLEX({ CARDS: cards });
};

const handleGestures = (e, setZoomedOut) => {
  e.preventDefault();
  const { STATE } = stateGuiMediator();
  const pinchDetected = (e) => e.ctrlKey;
  const isZoomIn = (deltaY) => !!Math.max(0, deltaY);
  const cardsAlreadyInMotion = () => !!Math.abs(STATE.CARDS_MOVING);
  const horisontalSwipeDetected = (e) =>
    Math.abs(e.deltaX) && Math.abs(e.deltaX) > Math.abs(e.deltaY);
  //
  if (pinchDetected(e)) {
    setZoomedOut(isZoomIn(e.deltaY));
  } else {
    // console.log(!horisontalSwipeDetected(e), cardsAlreadyInMotion());
    if (!horisontalSwipeDetected(e) || cardsAlreadyInMotion()) return;
    console.log('PAN', e.deltaX);
    if (e.deltaX < 0) {
      // previous card.
      const nextSelectedIndex = Math.max(0, STATE.SELECTED_INDEX - 1);
      slideCards({ nextIndex: nextSelectedIndex });
    } else {
      // Next card.
      const nextSelectedIndex = Math.min(
        STATE.CARDS.length - 1,
        STATE.SELECTED_INDEX + 1
      );
      slideCards({ nextIndex: nextSelectedIndex });
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
  const [, setScrollDisabled] = usePreventScroll(true);

  const toggleZoomInOut = () => setZoomedOut(!zoomedOut);

  const handleClick = async (e) => {
    const selectedCard = e.target.closest('.card-section');
    if (!selectedCard) return;
    const { index: nextIndex } = selectedCard.dataset;
    return slideCards({ nextIndex });
  };

  useEffect(() => {
    const init = async () => {
      const cardsArr = await fetchApi();
      setCardsToMicroState(cardsArr);
      await preloadImages(cardsArr);
      setPreloading(false);
      setHideSlider(true);
      setOptions(cardsArr);
      await initiate();
      setHideSlider(false);
      setScrollDisabled(true);
      console.log('React inited');
    };
    init();
  }, [setOptions, setScrollDisabled]);

  useEffect(() => {
    const el = cardContainer.current.parentElement;
    el.addEventListener(
      'wheel',
      _.throttle((e) => handleGestures(e, setZoomedOut), 800, {
        leading: true,
        trailing: false,
      })
    );
    window.addEventListener('click', clickActions);
    async function clickActions(e) {
      if (zoomedOut) setZoomedOut(false);
      await handleClick(e);
    }
    return () => {
      el.removeEventListener(
        'wheel',
        _.throttle((e) => handleGestures(e, setZoomedOut), 800, {
          leading: true,
          trailing: false,
        })
      );
      window.removeEventListener('click', clickActions);
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
