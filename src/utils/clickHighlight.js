/*
This function creates a quick soft expanding ring where the user clicks.
clickHighlight(clickevent) returns a promise and when 
it is run it creates and places the higlighting div in the click centre. 
Next it removes the 'active' class and lets the animation run
before it hides itself until next times it is activated.
The clickDelay constant is the time before the promise resolves. This time
is shorter than the animation for a snappier experience.

It is run outside of any framework and thus not affected by renders.
*/
const clickDelay = 100;
const WrapperClass = 'click-marker'; // Match with CSS.

const createHtml = () => {
  const div = document.createElement('div');
  div.appendChild(document.createElement('div'));
  div.className = WrapperClass;
  document.body.appendChild(div);
  return document.querySelector('.' + WrapperClass);
};

const clickHighlight = (e) => {
  return new Promise((resolve) => {
    const clickMarkerRef =
      document.querySelector('.' + WrapperClass) || createHtml();
    clickMarkerRef.style.top = e.clientY + 'px';
    clickMarkerRef.style.left = e.clientX + 'px';
    clickMarkerRef.classList.add('active');
    setTimeout(() => {
      clickMarkerRef.classList.remove('active');
      setTimeout(resolve, clickDelay);
    });
  });
};

export default clickHighlight;

/* 
Add to root css:
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
*/
