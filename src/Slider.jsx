import { useEffect, useState, useRef } from 'react';
import BtnToggle from './BtnToggle.jsx';
import usePreventScroll from './utils/usePreventScroll';
// import Portal from './Portal';
// import motionBlur from './utils/motion-blur-move';
import microState from './utils/microState';
import preloadImages from './utils/preloadImages';
import easeTo from './utils/easeTo';
// import _ from 'lodash';
import clsx from 'clsx';
import { usePinch, useGesture, useDrag } from 'react-use-gesture';
// import { useSpring, animated } from 'react-spring';

/* TODO
- Test the 'touchmove' event for iphone.
- Make zoom to a boolean setting.
- Make show unselected images a boolean setting.
- Create overscroll animation on slide endpoints. DONE
- Create fixed image with masked corresponding image underneath if possible.
Nice to have:
- Alternative CSS transition scroll.
*/

/* Helper functions */
const log = (x) => {
  const el = document.querySelector('.log');
  el.innerHTML = JSON.stringify(x) + '<br>' + el.innerHTML;
};
const approximatelyEqual = (v1, v2, epsilon = 0.001) =>
  Math.abs(v1 - v2) < epsilon;
const clampNumber = (num, max, min) =>
  Math.max(Math.min(num, Math.max(max, min)), Math.min(max, min));

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
  SCROLL_POS: { current: 0, unit: '', css: false },
  ZOOMED_OUT: { current: false, unit: '', css: false },
  MAX_SCROLL_DISTANCE: { current: 0, unit: 'px', css: false },
});

async function initiate() {
  await adjustCardSpacing();
  return new Promise((resolve) => {
    resetCardsPos();
    resolve();
  });
}

const adjustCardSpacing = () => {
  const { SET, STATE, cardsCollection } = stateGuiMediator();
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
      const MAX_SCROLL_DISTANCE =
        CARD_SCROLL_DISTANCE * (STATE.CARDS.length - 1);
      SET({
        IMG_WIDTH,
        CARD_WIDTH,
        CARD_GAP,
        CARD_SCROLL_DISTANCE,
        CARD_IMG_SPACING,
        MAX_SCROLL_DISTANCE,
      });
      [...cardsCollection].forEach((card, i) => {
        card.dataset.posx = Math.round(CARD_SCROLL_DISTANCE * i);
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

// const slideCards = ({ nextIndex }) => {
//   console.assert(
//     !isNaN(nextIndex) && nextIndex >= 0,
//     `Wrong argument passed to slideCards function.`
//   );
//   const index = parseInt(nextIndex);
//   const { cardsWrapper, cardsCollection, SET, STATE } = stateGuiMediator();
//   _setState({ index });
//   const cardsWrapperStyles = window.getComputedStyle(cardsWrapper);
//   // eslint-disable-next-line
//   const regexParentesisContent = /\(([^\)]*)\)/;
//   const startValue =
//     window.getComputedStyle(cardsWrapper).transform !== 'none'
//       ? Math.round(
//           cardsWrapperStyles.transform
//             .match(regexParentesisContent)[1]
//             .split(',')[4]
//         )
//       : 0;
//   const endValue = STATE.CARD_SCROLL_DISTANCE * index * -1;
//   // Skip motionblur on anything else than chromium.
//   const isChrome =
//     !!window.chrome && (!!window.chrome.webstore || !!window.chrome.runtime);
//   const isEdgeChromium = isChrome && navigator.userAgent.indexOf('Edg') !== -1;
//   const useMotionBlur = isChrome || isEdgeChromium;
//   //
//   return motionBlur(cardsWrapper, {
//     durationMs: 250,
//     properties: [
//       {
//         property: 'transform',
//         start: `translateX(${startValue}px)`,
//         end: `translateX(${endValue}px)`,
//       },
//     ],
//     applyToggle: false,
//     easing: 'easeOutQuad',
//     useMotionBlur,
//     blurMultiplier: 0.2,
//   }).then(({ element }) => {
//     SET({ CARDS_MOVING: 0 });
//     _setSelectedCardIndex(index);
//     // console.log('done', element);
//   });
//   function _setState({ index }) {
//     let CARDS_MOVING = 0;
//     if (index > STATE.SELECTED_INDEX) CARDS_MOVING = 1;
//     if (index < STATE.SELECTED_INDEX) CARDS_MOVING = -1;
//     SET({ SELECTED_INDEX: index, CARDS_MOVING });
//   }
//   function _setSelectedCardIndex(index) {
//     [...cardsCollection].forEach((card) => {
//       card.classList.remove('selected');
//     });
//     cardsCollection[index].classList.add('selected');
//   }
// };

const stateGuiMediator = () => {
  const cardsCollection = document.querySelectorAll('.card-section');
  const cardsWrapper = cardsCollection[0]?.parentElement;
  const firstImage = cardsCollection[0]?.querySelector('img');
  const documentRoot = document.documentElement;
  const cardContainer = document.querySelector('.card-container');
  const zoomBtn = document.querySelector('.zoom-toggle');
  // Micro state helper functions.
  const { ADD, SET, STATE, SET_COMPLEX, REMOVE } = microState();
  return {
    cardsCollection,
    cardsWrapper,
    cardContainer,
    firstImage,
    zoomBtn,
    documentRoot,
    ADD,
    SET,
    STATE,
    SET_COMPLEX,
    REMOVE,
  };
};

// const test = process.env;
// console.log('test', test);
const fetchApi = () => {
  // const { SET } = stateGuiMediator();
  return new Promise((resolve) => {
    // const tempUrl = 'https://source.unsplash.com/random/500x500';
    const cardsArr = [
      {
        header: 'header1',
        imageUrl: '/images/00042_G.png',
      },
      {
        header: 'header2',
        imageUrl: '/images/00042_H.png',
      },
      {
        header: 'header3',
        imageUrl: '/images/00042_J.png',
      },
      {
        header: 'header4',
        imageUrl: '/images/00042_L.png',
      },
      {
        header: 'header5',
        imageUrl: '/images/00042_S.png',
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

// const handleGestures = (e, setZoomedOut) => {
//   e.preventDefault();
//   const { cardsWrapper, STATE, SET, REMOVE } = stateGuiMediator();
//   const pinchDetected = (e) => e.ctrlKey;
//   const isZoomIn = (deltaY) => !!Math.max(0, deltaY);
//   const cardsAlreadyInMotion = () => !!Math.abs(STATE.CARDS_MOVING);
//   const horisontalSwipeDetected = (e) =>
//     Math.abs(e.deltaX) && Math.abs(e.deltaX) > Math.abs(e.deltaY);
//   //
//   if (pinchDetected(e)) {
//     setZoomedOut(isZoomIn(e.deltaY));
//   } else {
//     // console.log(!horisontalSwipeDetected(e), cardsAlreadyInMotion());
//     if (!horisontalSwipeDetected(e) || cardsAlreadyInMotion()) return;
//     console.log('PAN', e.deltaX);
//     if (e.deltaX < 0) {
//       // previous card.
//       const nextSelectedIndex = Math.max(0, STATE.SELECTED_INDEX - 1);
//       const isOverscrollLeft = STATE.SELECTED_INDEX - 1 < 0;
//       if (isOverscrollLeft) overScrollAnim(1);
//       else slideCards({ nextIndex: nextSelectedIndex });
//     } else {
//       // Next card.
//       const isOverscrollRight =
//         STATE.CARDS.length - 1 < STATE.SELECTED_INDEX + 1;
//       const nextSelectedIndex = Math.min(
//         STATE.CARDS.length - 1,
//         STATE.SELECTED_INDEX + 1
//       );
//       if (isOverscrollRight) overScrollAnim(-1);
//       else slideCards({ nextIndex: nextSelectedIndex });
//     }
//     async function overScrollAnim(dir) {
//       if (debounce()) return;
//       const overScrollDist = -40;
//       // eslint-disable-next-line
//       const regexParentesisContent = /\(([^\)]*)\)/;
//       const cardsWrapperStyles = window.getComputedStyle(cardsWrapper);
//       const startValue =
//         window.getComputedStyle(cardsWrapper).transform !== 'none'
//           ? Math.round(
//               cardsWrapperStyles.transform
//                 .match(regexParentesisContent)[1]
//                 .split(',')[4]
//             )
//           : 0;
//       await motionBlur(cardsWrapper, {
//         durationMs: 100,
//         properties: [
//           {
//             property: 'transform',
//             start: `translateX(${startValue}px)`,
//             end: `translateX(${startValue - overScrollDist * dir}px)`,
//           },
//         ],
//         easing: 'easeOutQuad',
//       });
//       motionBlur(cardsWrapper, {
//         durationMs: 250,
//         properties: [
//           {
//             property: 'transform',
//             start: `translateX(${startValue - overScrollDist * dir}px)`,
//             end: `translateX(${startValue}px)`,
//           },
//         ],
//         easing: 'easeInQuad',
//       });
//       function debounce() {
//         if (STATE.TEMP_OVERSCROLL_PREVENTER) return true;
//         SET({ TEMP_OVERSCROLL_PREVENTER: true });
//         setTimeout(() => {
//           REMOVE({ TEMP_OVERSCROLL_PREVENTER: null });
//         }, 1000);
//         return false;
//       }
//     }
//   }
// };

const doOnPinch = (state, setZoomedOut) => {
  if (state.pinching) {
    const { SET } = stateGuiMediator();
    const isPinching = state.vdva[0] < 0 ? true : false;
    setZoomedOut(isPinching);
    SET({ ZOOMED_OUT: isPinching });
  }
};

// const wheel = (x) => {
//   const { SET, STATE, cardsWrapper } = stateGuiMediator();
//   const { CARD_SCROLL_DISTANCE, CARDS } = STATE;
//   if (!CARDS.length || !cardsWrapper) return 0;
//   console.log('x-diff:', Math.round(window.temp - x));
//   const maxScrollDistance = CARD_SCROLL_DISTANCE * (CARDS.length - 1);
//   const clampNumber = (num, max, min) =>
//     Math.max(Math.min(num, Math.max(max, min)), Math.min(max, min));
//   const xpos = STATE.SCROLL_POS + x - (window.temp || 0);
//   window.temp = x;
//   const clamped_xpos = clampNumber(xpos, maxScrollDistance, 0);
//   SET({ SCROLL_POS: clamped_xpos });
//   return `translateX(${clamped_xpos * -1}px)`; // -imgWidth * (x < 0 ? 6 : 1) - (x % (imgWidth * 5
// };

// Prevent accesability zoom in safari/iphone.
document.addEventListener('gesturestart', (e) => e.preventDefault());
document.addEventListener('gesturechange', (e) => e.preventDefault());
// let el;
// const preventHistoryBack = (e) => {
//   var delta = e.deltaX || e.wheelDeltaX;
//   if (!delta) return;
//   window.WebKitMediaKeyError /*detect safari*/ && (delta *= -1);
//   if (
//     (el.scrollLeft + el.offsetWidth === el.scrollWidth && delta > 0) ||
//     (el.scrollLeft === 0 && delta < 0)
//   ) {
//     e.preventDefault();
//     console.log('preventing');
//   }
// };
// window.onload = () => {
//   el = document.querySelector('.pancake-grid');
//   el.addEventListener('mousewheel', preventHistoryBack, false);
//   el.addEventListener('wheel', preventHistoryBack, false);
// };

const onInteractionFn = (pointerState) => {
  if (!pointerState) return { moveTo, easeSliderTo };
  console.log(pointerState.event.type);
  if (['pointerdown', 'pointerup'].includes(pointerState.event.type)) return;
  const {
    // offset: [x],
    delta,
    axis,
    wheeling,
    dragging,
    event,
  } = pointerState;
  // console.log('movement[0], x', Math.round(movement[0] / 15), window.temp - x);
  event.preventDefault();
  const snapDurationMS = 400;
  const { SET, STATE } = stateGuiMediator();
  const { CARD_SCROLL_DISTANCE, CARDS, SCROLL_POS } = STATE;
  let sign = -1;
  if ((axis === 'x' && delta[0] > 0) || (axis === 'y' && delta[0] > 0))
    sign = 1;
  log(sign + ' ' + delta[0] + ' ' + delta[1]);
  const x = axis === 'x' ? delta[0] : delta[1];
  const xpos = SCROLL_POS - x * 1.3;
  if (wheeling || dragging) moveTo({ target: xpos });
  else {
    const snapValues_arr = CARDS.map((card, i) => CARD_SCROLL_DISTANCE * i);
    const [nearestCardPos, selectedIndex] = snapToCardPos(
      -SCROLL_POS,
      snapValues_arr
    );
    SET({ SELECTED_INDEX: selectedIndex });
    const target_x = -nearestCardPos;
    const targetDistance = Math.round(target_x - SCROLL_POS);
    // TODO: use extracted function instead.
    easeTo({
      durationMs: snapDurationMS,
      targetDistance,
      fnToRun: function (x) {
        moveTo({ target: SCROLL_POS + x });
      },
    }).then((lastx) => {
      console.log('done', Math.round(lastx), selectedIndex);
    });
  }

  async function easeSliderTo({ distance, target, index, durationMs = 800 }) {
    if (!_argsAreValid(arguments[0])) return;
    const { SET, STATE, cardsCollection } = stateGuiMediator();
    const { SCROLL_POS, MAX_SCROLL_DISTANCE } = STATE;
    if (distance) target = SCROLL_POS + x;
    if (index) {
      target = +cardsCollection[index].dataset.posx;
    } else {
      target = +target;
      [...cardsCollection].forEach((c, i) => {
        if (+c.dataset.posx === target) index = i;
      });
    }
    const clamped_xpos = clampNumber(target, 0, MAX_SCROLL_DISTANCE);
    distance = Math.round(-clamped_xpos - SCROLL_POS);
    SET({ SELECTED_CARD: index });
    // SET({ SCROLL_POS: clamped_xpos });
    return easeTo({
      durationMs,
      targetDistance: distance,
      fnToRun: function (x) {
        console.assert(!isNaN(x), 'X-position is not a number in callback.');
        moveTo({ target: SCROLL_POS + x });
      },
    });
    // .then((lastx) => {
    //   debugger;
    //   console.log('done', Math.round(lastx), index);
    // });
  }

  function _argsAreValid({ distance, target, index }) {
    const noError =
      [distance, target, index].filter((a) => typeof a !== 'undefined')
        .length === 1;
    console.assert(
      noError,
      'The moveTo() function can only take one argument.'
    );
    return noError;
  }

  function moveTo({ distance, target, index }) {
    const { SET, STATE, cardsWrapper, cardsCollection } = stateGuiMediator();
    const { MAX_SCROLL_DISTANCE, SCROLL_POS } = STATE;
    if (!_argsAreValid(arguments[0])) return;
    if (distance) target = SCROLL_POS + x;
    if (index) target = +cardsCollection[index].dataset.posx;
    const clamped_xpos = clampNumber(target, 0, -MAX_SCROLL_DISTANCE);
    SET({ SCROLL_POS: clamped_xpos });
    cardsWrapper.style.transform = `translateX(${clamped_xpos}px)`;
    handleTranlucensy(-clamped_xpos);
  }

  function handleTranlucensy(clamped_xpos) {
    const { STATE, cardsCollection } = stateGuiMediator();
    const { ZOOMED_OUT, CARD_WIDTH, IMG_WIDTH } = STATE;
    if (ZOOMED_OUT) {
      [...cardsCollection].forEach((card, i) => {
        card.querySelector('img').style.opacity = 1;
      });
      return;
    }
    const fadeMarginPx = 100;
    // Test to see wich is most performance, CSS transition or JS high freq update.
    const useCSSTransitionNotHighFreqJS = false;
    const totalCardWidth = Math.max(CARD_WIDTH, IMG_WIDTH);
    [...cardsCollection].forEach((card, i) => {
      const cardPosition = +card.dataset.posx;
      const cardImg = card.querySelector('img');
      let styleObj = { opacity: 0 };
      if (
        approximatelyEqual(
          cardPosition,
          clamped_xpos,
          totalCardWidth / 2 + fadeMarginPx
        )
      ) {
        const dist = Math.abs(cardPosition - clamped_xpos);
        let percent = 1 - Math.abs((dist - totalCardWidth) / dist);
        percent = clampNumber(percent, 1, 0);

        if (dist > totalCardWidth / 2) {
          styleObj = useCSSTransitionNotHighFreqJS
            ? {
                transition: 'opacity 500ms',
                willChange: 'opacity',
                opacity: '0',
              }
            : { opacity: percent };
        }
      } else {
        styleObj = { opacity: 1 };
      }
      Object.assign(cardImg.style, styleObj);
    });
  }

  function snapToCardPos(x, snapValues_arr) {
    let nearValue = x,
      index;
    snapValues_arr.forEach((snapPos, i) => {
      if (approximatelyEqual(x, snapPos, CARD_SCROLL_DISTANCE / 2)) {
        nearValue = snapPos;
        index = i;
      }
    });
    return [nearValue, index];
  }
};

function Slider() {
  console.log('rendered');
  // const {SET} = stateGuiMediator();
  const domTarget = useRef(null);
  const [options, setOptions] = useState([]);
  const [preloading, setPreloading] = useState(true);
  const [hideSlider, setHideSlider] = useState(false);
  const cardContainer = useRef();
  const [zoomedOut, setZoomedOut] = useState(false);
  const [, setScrollDisabled] = usePreventScroll(true);
  usePinch((state) => doOnPinch(state, setZoomedOut), {
    domTarget,
    eventOptions: { passive: false },
  });

  useGesture(
    {
      onWheel: (state) => onInteractionFn(state),
      onPointerDown: ({ event, ...sharedState }: event) => {
        handleClick(event);
      },
    },
    { domTarget, eventOptions: { passive: false } }
  );
  useDrag(
    (state) =>
      onInteractionFn({ ...state, delta: state.delta.map((x) => x * -3) }),
    {
      domTarget,
      delay: true,
      eventOptions: { passive: false },
    }
  );

  const toggleZoomInOut = () => setZoomedOut(!zoomedOut);

  const handleClick = async (e) => {
    const clickInsideZoomToggleBtn = (e) => !!e.target.closest('.zoom-toggle');
    if (clickInsideZoomToggleBtn(e)) return;
    if (zoomedOut) setZoomedOut(false);
    const selectedCard = e.target.closest('.card-section');
    if (!selectedCard) return;
    // const { index: nextIndex, posx } = selectedCard.dataset;
    const { easeSliderTo } = onInteractionFn();
    await easeSliderTo({ target: +selectedCard.dataset.posx });
    console.log('wait done');
    // return slideCards({ nextIndex });
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
      if (true) setScrollDisabled(true);
      console.log('React inited');
    };
    init();
  }, [setOptions, setScrollDisabled]);

  // useEffect(() => {
  //   window.addEventListener('click', clickActions);
  //   const clickInsideZoomToggleBtn = (e) => !!e.target.closest('.zoom-toggle');
  //   //
  //   async function clickActions(e) {
  //     if (clickInsideZoomToggleBtn(e)) return;
  //     if (zoomedOut) setZoomedOut(false);
  //     await handleClick(e);
  //   }
  // }, [zoomedOut]);

  const cardContainerStyles = clsx({
    'card-container': true,
    ispreloading: preloading,
    'zoomed-out': zoomedOut,
  });

  return (
    <div ref={domTarget} style={{ width: '100%', height: '100%' }}>
      <div ref={cardContainer} className={cardContainerStyles}>
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
      </div>
      <BtnToggle
        toggleZoomInOut={toggleZoomInOut}
        zoomedOut={zoomedOut}
      ></BtnToggle>
    </div>
  );
}

export default Slider;
