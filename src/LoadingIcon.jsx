import { useState, useEffect } from 'react';
import UseAnimations from 'react-useanimations';
import loading from 'react-useanimations/lib/loading';
import Portal from './Portal';
import styled from 'styled-components';
// import useText from './useTexts';

const Wrapper = styled.div`
  display: inline-flex;
  flex-flow: column;
  justify-content: center;
  align-items: center;
  height: 100px;
  pointer-events: none;
  svg {
    opacity: 0.8;
  }
  p {
    text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.3);
    transition: all 1s;
    font-family: 'Scania Sans bold', Helvetica, sans-serif;
    font-size: 0.8em;
    color: white;
    opacity: 1;
    &.fade-in {
      opacity: 0;
    }
  }
`;

const LoadingIcon = ({ size = 24, displayMode, ...rest } = {}) => {
  const [showText, setShowText] = useState(false);
  const t = () => 'Still loading'; // useText();

  useEffect(() => {
    const id = setTimeout(() => {
      console.log('Still mounted after 500ms');
      setShowText(true);
      setTimeout(() => {
        const loadingText = document.querySelector('p.fade-in');
        if (loadingText) loadingText.classList.remove('fade-in');
      }, 300);
    }, 1500);
    return () => {
      clearTimeout(id);
      setShowText(false);
    };
  }, []);

  return (
    <div>
      {displayMode === 'portal' ? (
        loadingIconPortal({ t, showText })
      ) : (
        <Wrapper {...rest}>
          <UseAnimations
            animation={loading}
            size={size}
            strokeColor="rgb(255,255,255)"
            style={{
              color: 'white',
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          />
          <p className="fade-in">
            {showText && t('LABEL_CONTINUE_LOADING')}...
          </p>
        </Wrapper>
      )}
    </div>
  );
};

function loadingIconPortal({ t, showText }) {
  return (
    <Portal>
      <Wrapper
        style={{
          color: 'white',
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      >
        <UseAnimations animation={loading} size={24} />
        <p className="fade-in">{showText && t('LABEL_CONTINUE_LOADING')}...</p>
      </Wrapper>
    </Portal>
  );
}

export default LoadingIcon;
