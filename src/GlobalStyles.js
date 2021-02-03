import { createGlobalStyle } from 'styled-components/macro';

const GlobalStyle = createGlobalStyle`
p {
  margin: 0.5em 0;
}

h1,
h2,
h3,
h4,
h5 {
  margin: 0;
}


body {
  margin: 0;
  font-family: 'Scania Sans', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  overscroll-behavior: none;
}
html {
  box-sizing: border-box;
}
*,
*:before,
*:after {
  box-sizing: inherit;
}

html.Chrome {
  filter: blur(0.25px);
  #root {
    position: fixed;
    top: 0;
    left: 0;
  }
}

#portal {
  position: fixed;
  width: 100vw;
  height: 100vh;
  top: 0;
  left: 0;
  pointer-events: none;
  & > * {
    pointer-events: all;
  }
}

.backdrop {
  background: radial-gradient(
      200px circle at 50% -10%,
      #e4e6ec 0%,
      rgba(228, 230, 236, 0) 100%
    ),
    linear-gradient(
      to bottom,
      #a1a6b2 0%,
      hsla(201, 5%, 56%, 1) 35%,
      hsla(200, 5%, 57%, 1) 68%,
      #d0d3db 91%,
      #d0d3db 100%
    );
  @media screen and (min-width: 576px) {
    background: radial-gradient(
        600px circle at 50% -20%,
        hsla(225, 17%, 91%, 1) 0%,
        hsla(225, 17%, 91%, 0) 100%
      ),
      radial-gradient(
        600px circle at 50% 110%,
        hsla(225, 17%, 91%, 1) 0%,
        hsla(225, 17%, 91%, 0) 100%
      ),
      radial-gradient(
        600px circle at 0% 40%,
        hsla(225, 10%, 61%, 1) -10%,
        hsla(225, 10%, 61%, 0) 100%
      ),
      linear-gradient(
        to bottom,
        #a1a6b2 0%,
        #9da5b0 35%,
        #8892a0 68%,
        #d0d3db 91%,
        #d0d3db 100%
      );
  }
}

.hidden {
  display: none !important;
}

.center {
  justify-content: center;
  align-content: center;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}

.box-shadow {
  box-shadow:
  /*bottom shadow*/ 0px 20px 20px rgba(0, 0, 0, 0.2),
    0px 5px 10px rgba(0, 0, 0, 0.2),
    /*long bottom shadow*/ 0px 70px 50px rgba(0, 0, 0, 0.4),
    /*right shadow*/ 30px 50px 50px rgba(0, 0, 0, 0.2),
    /*left shadow*/ -30px 50px 50px rgba(0, 0, 0, 0.2),
    /*right inset*/ inset 20px 0px 60px rgba(0, 0, 0, 0.1),
    /*left inset*/ inset -20px 0px 60px rgba(0, 0, 0, 0.1);
}
html.Chrome .box-shadow {
  filter: blur(0.25px);
}

@keyframes placeHolderShimmer {
  0% {
    background-position: -468px 0;
  }
  100% {
    background-position: 468px 0;
  }
}

.animated-background {
  animation-duration: 1.25s;
  animation-fill-mode: forwards;
  animation-iteration-count: infinite;
  animation-name: placeHolderShimmer;
  animation-timing-function: linear;
  // background: darkgray;
  background-image: linear-gradient(
    to right,
    rgba(0, 0, 0, 0.05) 10%,
    rgba(0, 0, 0, 0.1) 18%,
    rgba(0, 0, 0, 0.05) 33%
  );
  background-size: 800px 104px;
  position: relative;
}

.backdrop {
  background: radial-gradient(
      200px circle at 50% -10%,
      #e4e6ec 0%,
      rgba(228, 230, 236, 0) 100%
    ),
    linear-gradient(
      to bottom,
      #a1a6b2 0%,
      hsla(201, 5%, 56%, 1) 35%,
      hsla(200, 5%, 57%, 1) 68%,
      #d0d3db 91%,
      #d0d3db 100%
    );
  @media screen and (min-width: 576px) {
    background: radial-gradient(
        600px circle at 50% -20%,
        hsla(225, 17%, 91%, 1) 0%,
        hsla(225, 17%, 91%, 0) 100%
      ),
      radial-gradient(
        600px circle at 50% 110%,
        hsla(225, 17%, 91%, 1) 0%,
        hsla(225, 17%, 91%, 0) 100%
      ),
      radial-gradient(
        600px circle at 0% 40%,
        hsla(225, 10%, 61%, 1) -10%,
        hsla(225, 10%, 61%, 0) 100%
      ),
      linear-gradient(
        to bottom,
        #a1a6b2 0%,
        #9da5b0 35%,
        #8892a0 68%,
        #d0d3db 91%,
        #d0d3db 100%
      );
  }
}

.click-marker {
  position: fixed;
  top: 50%;
  left: 50%;
  width: 1px;
  height: 1px;
  pointer-events: none;
  div {
    --transition-time: 500ms;
    position: absolute;
    transform-origin: center;
    transform: translate(-50%, -50%) scale(1);
    transition: transform var(--transition-time) ease-out,
      opacity var(--transition-time) ease-out,
      border-width var(--transition-time) cubic-bezier(0.25, 0.46, 0.45, 0.94);
    border-width: 1px;
    opacity: 0;
    filter: blur(10px);
    width: 200px;
    height: 200px;
    border-radius: 50%;
    border-color: white;
    border-style: solid;
  }
  &.active div {
    transform: translate(-50%, -50%) scale(0.1);
    border-width: 50px;
    opacity: 0.5;
    transition: none;
  }
}

:root {
  --header-height: 100px;
  --card-gap: 100px; // image spacing will overwrite this.
  --card-width: 300px;
  --card-center-offset: calc(var(--card-width) / -2);
  --card-img-spacing: 100px; // Source for distribution.
  --selected-img-height: 55vh;
  --slider-vertical-padding: 15px;
  --debug-boxes: 1px dashed rgba(255, 255, 255, 0);
}
`;

export default GlobalStyle;
