import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import BtnToggle from './BtnToggle.jsx';
import usePreventScroll from './utils/usePreventScroll';
import microState, { useMicroStateSync } from './utils/microState';
import preloadImages from './utils/preloadImages';
import easeTo from './utils/easeTo';
import clsx from 'clsx';
import { usePinch, useGesture, useDrag } from 'react-use-gesture';
// import { useSpring, animated } from 'react-spring';
import { SelectedOption, LoadingIconStyled } from './sliderStyles.js';
// import LoadingIcon from './LoadingIcon';

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
const touchSupported = () =>
  'ontouchstart' in window ||
  (window.DocumentTouch && document instanceof window.DocumentTouch);
const approximatelyEqual = (v1, v2, epsilon = 0.001) =>
  Math.abs(v1 - v2) < epsilon;
const clampNumber = (num, max, min) =>
  Math.max(Math.min(num, Math.max(max, min)), Math.min(max, min));
/* End: Helper functions */

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
  const { SET, STATE } = stateGuiMediator();
  await adjustCardSpacing();
  return new Promise((resolve) => {
    const defaultSelectIndex = STATE.CARDS.findIndex((c) => c.defaultSelected);
    SET({ SELECTED_INDEX: defaultSelectIndex || 0 });
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
  return new Promise((resolve) => {
    const cardsArr = [
      {
        header: 'header 1',
        imageUrl: '/images/00042_G.png',
        defaultSelected: false,
      },
      {
        header: 'header 2',
        imageUrl: '/images/00042_H.png',
        defaultSelected: true,
      },
      {
        header: 'header 3',
        imageUrl: '/images/00042_J.png',
        defaultSelected: false,
      },
      {
        header: 'header 4',
        imageUrl: '/images/00042_L.png',
        defaultSelected: false,
      },
      {
        header: 'header 5',
        imageUrl: '/images/00042_S.png',
        defaultSelected: false,
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

const doOnPinch = (state, setZoomedOut) => {
  if (state.pinching) {
    const { SET, STATE } = stateGuiMediator();
    let [isPinching] = state.vdva;
    if (isPinching === 0) return;
    isPinching = isPinching < 0;
    if (isPinching === STATE.ZOOMED_OUT) return;
    setZoomedOut(isPinching);
    SET({ ZOOMED_OUT: isPinching });
  }
};

// Prevent accesability zoom in safari/iphone.
document.addEventListener('gesturestart', (e) => e.preventDefault());
document.addEventListener('gesturechange', (e) => e.preventDefault());

const onInteractionFn = (pointerState, reactScopeForwarding) => {
  if (!pointerState) return { moveTo, easeSliderTo };
  // console.log('Event type:', pointerState.event.type);
  // log(pointerState.event.type);
  if (
    ['pointerdown', 'pointerup', 'pointermove'].includes(
      pointerState.event.type
    ) &&
    !touchSupported()
  )
    return;
  const {
    // offset: [x],
    delta,
    axis,
    wheeling,
    dragging,
    event,
  } = pointerState;
  event.preventDefault();
  const snapDurationMS = 400;
  const { SET, STATE } = stateGuiMediator();
  const { CARD_SCROLL_DISTANCE, CARDS, SCROLL_POS } = STATE;
  reactScopeForwarding('setShowLoadingIcon', [true]);
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
    reactScopeForwarding('setSelectedIndex', [selectedIndex]);
    const target_x = -nearestCardPos;
    const targetDistance = Math.round(target_x - SCROLL_POS);
    // TODO: use extracted function instead.
    return easeTo({
      durationMs: snapDurationMS,
      targetDistance,
      fnToRun: (x) => {
        console.log('x', x);
        moveTo({ target: SCROLL_POS + x });
      },
    }).then(() => {
      reactScopeForwarding('setShowLoadingIcon', [false]);
    });
    // .then((lastx) => {
    //   console.log('done', Math.round(lastx), selectedIndex);
    // });
    // easeSliderTo({ distance: targetDistance, durationMs: snapDurationMS });
  }

  async function easeSliderTo(
    { distance, target, index, durationMs = 400 },
    reactScopeForwarding
  ) {
    if (!_argsAreValid(arguments[0])) return;
    const { SET, STATE, cardsCollection } = stateGuiMediator();
    const { SCROLL_POS, MAX_SCROLL_DISTANCE } = STATE;
    if (distance) target = SCROLL_POS + x;
    if (index >= 0) {
      target = +cardsCollection[index].dataset.posx;
    } else {
      target = +target;
      index = [...cardsCollection].findIndex((c) => +c.dataset.posx === target);
    }
    const clamped_xpos = clampNumber(target, 0, MAX_SCROLL_DISTANCE);
    distance = Math.round(-clamped_xpos - SCROLL_POS);
    SET({ SELECTED_INDEX: index });
    reactScopeForwarding('setSelectedIndex', [index]);
    return easeTo({
      durationMs,
      targetDistance: distance,
      fnToRun: (x) => moveTo({ target: SCROLL_POS + x, index }),
    });
  }

  function moveTo({ distance, target, index }) {
    const { SET, STATE, cardsWrapper, cardsCollection } = stateGuiMediator();
    const { MAX_SCROLL_DISTANCE, SCROLL_POS } = STATE;
    // console.log('target', target);
    if (!_argsAreValid(arguments[0])) return;
    if (distance && !index) target = SCROLL_POS + x;
    if (index && !distance && !target)
      target = -cardsCollection[index].dataset.posx;
    console.assert(
      target <= 20,
      `Target in moveTo fn out of bounds. ${target}`
    );
    const clamped_xpos = clampNumber(target, 0, -MAX_SCROLL_DISTANCE);
    SET({ SCROLL_POS: clamped_xpos });
    cardsWrapper.style.transform = `translateX(${clamped_xpos}px)`;
    handleTranlucensy(-clamped_xpos);
  }

  function _argsAreValid({ distance, target, index }) {
    const hasRelativOrAbsolutArgs = [distance, target].filter(
      (a) => typeof a !== 'undefined'
    ).length;
    const noError = hasRelativOrAbsolutArgs === 1 || index >= 0;
    console.assert(
      noError,
      'The moveTo() function can only take distance OR target, AND/OR index.'
    );
    return noError;
  }

  function handleTranlucensy(clamped_xpos) {
    const maxOpacity = 0.5;
    const { STATE, cardsCollection } = stateGuiMediator();
    const { ZOOMED_OUT, CARD_WIDTH, IMG_WIDTH } = STATE;
    if (ZOOMED_OUT) {
      [...cardsCollection].forEach((card, i) => {
        card.querySelector('img').style.opacity = maxOpacity;
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
        percent = clampNumber(percent, 1, 0) * maxOpacity;

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
        styleObj = { opacity: maxOpacity };
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

const swipe = async (state, reactScopeForwarding) => {
  const {
    delta: [x],
  } = state;
  const { SET, STATE } = stateGuiMediator();
  // console.log('state', state);
  if (STATE.CARDS_MOVING && state._lastEventType === 'pointerup') {
    cancelLock();
    return;
  }
  // if (state._lastEventType === 'pointerup' && x === 0) log('rejected touch');
  if (STATE.CARDS_MOVING || x === 0) return;
  SET({ CARDS_MOVING: true });
  reactScopeForwarding('setShowLoadingIcon', [true]);
  let nextIndex = STATE.SELECTED_INDEX + (x < 0 ? 1 : -1);
  nextIndex = clampNumber(nextIndex, STATE.CARDS.length - 1, 0);
  const { easeSliderTo } = onInteractionFn();
  await easeSliderTo({ index: nextIndex });
  // log('Done moving');
  setTimeout(cancelLock, 1000);

  function cancelLock() {
    console.log('pointer up');
    SET({ CARDS_MOVING: false });
    reactScopeForwarding('setShowLoadingIcon', [false]);
  }
};

function Slider() {
  console.log('rendered');
  // const {SET} = stateGuiMediator();
  const domTarget = useRef(null);
  const selectedImage = useRef('');
  const [cardOptions, setCardOptions] = useState([]);
  const [preloading, setPreloading] = useState(true);
  const [hideSlider, setHideSlider] = useState(false);
  const cardContainer = useRef();
  const [zoomedOut, setZoomedOut] = useState(false);
  const [, setScrollDisabled] = usePreventScroll(true);
  const [showLoadingIcon, setShowLoadingIcon] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Forward scoped functions from react pure JS.
  const forwardedFunctions = useMemo(
    () => ({
      setShowLoadingIcon,
      setSelectedIndex,
    }),
    [setShowLoadingIcon, setSelectedIndex]
  );
  const reactScopeForwarding = useCallback(
    (fn_str, args_arr) => {
      forwardedFunctions[fn_str].apply(null, args_arr);
    },
    [forwardedFunctions]
  );
  // End: Forward scoped functions from react.

  usePinch((state) => doOnPinch(state, setZoomedOut), {
    domTarget,
    eventOptions: { passive: false },
  });
  useMicroStateSync({ zoomedOut });

  useGesture(
    {
      // onWheel: (state) => swipe(state),
      onWheel: (state) => onInteractionFn(state, reactScopeForwarding),
      onPointerDown: ({ event, ...sharedState }) => {
        if (event.pointerType === 'mouse') handleClick(event);
        else {
          // if (event.pointerType === 'touch')
          setTimeout(() => {
            const { STATE } = stateGuiMediator();
            if (!STATE.CARDS_MOVING) log('##### Touch tap');
          }, 100);
        }
      },
    },
    { domTarget, eventOptions: { passive: false } }
  );
  useDrag(
    (state) => {
      if (state._dragIsTap) return;
      // console.log('Touch tap detected');
      else swipe(state, reactScopeForwarding);
    },
    // ({ delta: [x] }) => log('wrong'),
    // onInteractionFn({ ...state, delta: state.delta.map((x) => x * -3) }),
    {
      domTarget,
      delay: false,
      eventOptions: { passive: false },
    }
  );

  const toggleZoomInOut = () => setZoomedOut(!zoomedOut);

  const handleClick = async (e) => {
    const clickInsideZoomToggleBtn = (e) => !!e.target.closest('.zoom-toggle');
    if (clickInsideZoomToggleBtn(e)) return;
    setZoomedOut(false);
    const selectedCard = e.target.closest('.card-section');
    if (!selectedCard) return;
    const { easeSliderTo } = onInteractionFn();
    await easeSliderTo({ target: +selectedCard.dataset.posx });
    console.log('wait done');
  };

  useEffect(() => {
    const init = async () => {
      const cardsArr = await fetchApi();
      setCardsToMicroState(cardsArr);
      await preloadImages(cardsArr);
      setSelectedIndex(cardsArr.findIndex((c) => c.selectedIndex));
      setPreloading(false);
      setHideSlider(true);
      setCardOptions(cardsArr);
      await initiate();
      setHideSlider(false);
      onInteractionFn().easeSliderTo(
        {
          index: stateGuiMediator().STATE.SELECTED_INDEX,
        },
        reactScopeForwarding
      );
      if (true) setScrollDisabled(true);
      console.log('React inited');
    };
    init();
  }, [setCardOptions, setScrollDisabled, reactScopeForwarding]);

  useEffect(() => {
    if (!cardOptions?.length) return;
    selectedImage.current.src = cardOptions[selectedIndex]?.imageUrl || '';
  }, [selectedIndex, cardOptions]);

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
            cardOptions.map((o, i) => (
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
            <>
              <div className="card-section center preloader-card">
                <div className="image animated-background"></div>
                <div className="header animated-background">
                  <h4>&nbsp;</h4>
                </div>
                <div className="paragraph animated-background">&nbsp;</div>
              </div>
              <div className="card-section center preloader-card">
                <div className="image animated-background"></div>
                <div className="header animated-background">
                  <h4>&nbsp;</h4>
                </div>
                <div className="paragraph animated-background">&nbsp;</div>
              </div>
            </>
          )}
        </div>
      </div>
      <SelectedOption>
        <img ref={selectedImage} src="" alt="selected option" />
        {showLoadingIcon && (
          <LoadingIconStyled size="42" displayMode="no-portal" />
        )}
      </SelectedOption>
      <BtnToggle
        toggleZoomInOut={toggleZoomInOut}
        zoomedOut={zoomedOut}
      ></BtnToggle>
    </div>
  );
}

export default Slider;
