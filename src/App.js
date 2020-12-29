import { useEffect, useState, useRef } from 'react';
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
  const { stateUpdate } = viewModel();
  return new Promise((resolve) => {
    const { firstImage } = viewModel();
    firstImage.addEventListener('load', _distributeCards);

    function _distributeCards(e) {
      const IMG_WIDTH = e.target.getBoundingClientRect().width;
      const sliderWrapper = document.querySelector('article');
      const root = window.getComputedStyle(sliderWrapper);
      const CARD_WIDTH = parseInt(root.getPropertyValue('--card-width'));
      const DIST_BTWN_CARDS = parseInt(
        root.getPropertyValue('--dist-btwn-cards')
      );
      stateUpdate({ IMG_WIDTH, CARD_WIDTH, DIST_BTWN_CARDS });
      const imageOverflow = (IMG_WIDTH - CARD_WIDTH) / 2;
      const cardGridGap = false
        ? window.innerWidth / 2 - IMG_WIDTH / 2 - CARD_WIDTH / 2
        : DIST_BTWN_CARDS + imageOverflow * 2;
      sliderWrapper.style.setProperty('--dist-btwn-cards', `${cardGridGap}px`);
      // debugger;
      // const root = window.getComputedStyle(document.querySelector(':root'));
      // root.setProperty('--dist-btwn-cards', imgWidth / 2 + gawBetween);
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
  const { cardsWrapper, cardsCollection } = viewModel();
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
  const endValue = global.DIST_BTWN_CARDS.current * index * -1;
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
  }).then(({ element }) => {
    console.log('done', element, selectedCard);
    [...cardsCollection].forEach((card) => {
      card.classList.remove('selected');
    });
    cardsCollection[index].classList.add('selected');
  });
}

// cardsWrapper.style.transform = `translateX(${
//   (offsetLeft + global.CARD_CENTER_OFFSET) * -1
// }px)`;

let global = Object.freeze({
  CARD_CENTER_OFFSET: { current: 0, unit: 'px', css: true },
  DIST_BTWN_CARDS: { current: 400, unit: 'px', css: true },
  CARD_WIDTH: { current: 300, unit: 'px', css: true },
  IMG_WIDTH: { current: 300, unit: 'px', css: true },
});

function resetCardsPos() {
  const { cardsCollection, cardsWrapper, stateUpdate } = viewModel();
  const { CARD_WIDTH } = global;
  const cardStyles = cardsCollection[0].getBoundingClientRect();
  const CARD_CENTER_OFFSET = Math.round(CARD_WIDTH.current / 2);
  const DIST_BTWN_CARDS =
    cardsCollection[1].getBoundingClientRect().x - cardStyles.x;
  cardsWrapper.style.left = `${CARD_CENTER_OFFSET * -1}px`;
  stateUpdate({
    DIST_BTWN_CARDS,
    CARD_CENTER_OFFSET,
  });
  console.table(global);
}

function viewModel() {
  const _cssCustomPropRoot = document.documentElement;
  const cardsCollection = document.querySelectorAll('.card-section');
  const cardsWrapper = cardsCollection[0] && cardsCollection[0].parentElement;
  const firstImage = cardsCollection[0].querySelector('img');
  // Mini state helper functions.
  const _stateKeyExist = (keyValueObj) =>
    Object.keys(keyValueObj)
      .map((key) => !!global[key])
      .some(Boolean);
  const stateUpdate = (keyValueObj) => {
    Object.keys(keyValueObj).forEach((key) => {
      // val can be simple number, partial object or full object.
      // full object => {current: 12, unit: 'px', css: true}
      const isObj = (val) => typeof val === 'object';
      const val = isObj(keyValueObj[key])
        ? { ...global[key], ...keyValueObj[key] }
        : { ...global[key], current: keyValueObj[key] };
      pushToCssCustProp({ key, val });
      global = { ...global, ...val };
    });
  };
  const stateAdd = (keyValueObj) =>
    !_stateKeyExist(keyValueObj)
      ? stateUpdate(keyValueObj)
      : console.error(`One or more keys already existed in state.`);
  const pushToCssCustProp = ({ key, val }) => {
    if (!val.css) return;
    debugger;
    viewModel()._cssCustomPropRoot.style.setProperty(
      `--${key.replace('_', '-')}`,
      val.current
    );
  };
  return {
    cardsCollection,
    cardsWrapper,
    firstImage,
    stateUpdate,
    stateAdd,
    _cssCustomPropRoot,
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
