/*
A simple exponentioal javascript slider for gui elements.
Runs a callback function as often as the browser is capable of rendering.
Easing can be altred to any easing algoritm.
Resolves a promise once done.
*/

const expoSlide = ({ durationMs, targetDistance, fnToRun }) => {
  return new Promise((resolve) => {
    let start;
    const easeOutQuad = (x) => 1 - (1 - x) * (1 - x);
    window.requestAnimationFrame(step);

    function step(timestamp) {
      start || (start = timestamp);
      const elapsedMs = timestamp - start;
      const linearProgress = elapsedMs / durationMs;
      const x = easeOutQuad(linearProgress) * targetDistance;
      fnToRun(x);
      if (elapsedMs < durationMs) {
        window.requestAnimationFrame(step); // Keep going.
      } else {
        // Movement done.
        resolve(targetDistance);
      }
    }
  });
};

export default expoSlide;
