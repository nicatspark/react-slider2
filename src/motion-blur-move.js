async function motionBlur(
  element,
  {
    durationMs = 1000,
    xTargetDistancePx = 0,
    yTargetDistancePx = 0,
    xTarget, // Optional absolute alternative.
    yTarget,
    applyToggle = false,
    easing = 'easeOutExpo',
    useMotionBlur = true,
    blurMultiplier = 1,
    docRoot = document,
  } = {}
) {
  return new Promise((resolve) => {
    let start;
    const easings = easingFactory();
    const elStartPosition = window.getComputedStyle(element);
    const originPos = {
      x: parseInt(elStartPosition.left),
      y: parseInt(elStartPosition.top),
    };
    // Motion blur specific.
    let previousX, previousY;
    if (useMotionBlur) initMotionBlur();
    //
    convertOptionalAbsoluteToRelative();
    handleToggleMode();

    function step(timestamp) {
      start || (start = timestamp);
      const elapsedMs = timestamp - start;
      const linearProgress = elapsedMs / durationMs;
      const easedProgress = {
        x: easings[easing](linearProgress) * xTargetDistancePx,
        y: easings[easing](linearProgress) * yTargetDistancePx,
      };
      //
      if (useMotionBlur) applyMotionBlur(easedProgress);
      //
      element.style.left = originPos.x + easedProgress.x + 'px';
      element.style.top = originPos.y + easedProgress.y + 'px';

      if (elapsedMs < durationMs) {
        window.requestAnimationFrame(step); // Keep going.
      } else {
        // Movement done.
        if (useMotionBlur) resetMotionBlur();
        element.style.left = Math.round(parseInt(element.style.left)) + 'px';
        element.style.top = Math.round(parseInt(element.style.top)) + 'px';
        resolve({ element });
      }
    }
    window.requestAnimationFrame(step); // Kicking off.

    function convertOptionalAbsoluteToRelative() {
      const absolutePositionsNotPresent =
        yTargetDistancePx + xTargetDistancePx !== 0 || !xTarget || !yTarget;
      if (absolutePositionsNotPresent) return;
      xTargetDistancePx = xTarget - originPos.x;
      yTargetDistancePx = yTarget - originPos.y;
    }

    function handleToggleMode() {
      if (element.dataset.toggle && applyToggle) {
        [xTargetDistancePx, yTargetDistancePx] = element.dataset.toggle
          .split(',')
          .map((x) => x * -1);
        delete element.dataset.toggle;
      } else if (applyToggle) {
        element.dataset.toggle = `${xTargetDistancePx},${yTargetDistancePx}`;
      }
    }

    function initMotionBlur() {
      // create svg imperatively.
      if (false) {
        // Skip until I figure out how to make it stick.
        const svgEl = document.createElement('svg');
        svgEl.setAttribute('width', '1');
        svgEl.setAttribute('height', '1');
        const defsEl = svgEl.appendChild(document.createElement('defs'));
        const filterEl = defsEl.appendChild(document.createElement('filter'));
        filterEl.setAttribute('id', 'svg-motion-blur');
        const feGaussianBlurEl = filterEl.appendChild(
          document.createElement('feGaussianBlur')
        );
        feGaussianBlurEl.setAttribute('in', 'SourceGraphic');
        feGaussianBlurEl.setAttribute('stdDeviation', '0 0');
        docRoot.body.appendChild(svgEl);
      }
      element.style.filter = 'url("#svg-motion-blur")';
      return;
    }

    function applyMotionBlur(easedProgress) {
      previousX || (previousX = easedProgress.x);
      previousY || (previousY = easedProgress.y);
      const diff = [
        Math.abs(Math.round((easedProgress.x - previousX) * blurMultiplier)),
        Math.abs(Math.round((easedProgress.y - previousY) * blurMultiplier)),
      ];
      const svg = docRoot.querySelector('feGaussianBlur');
      svg.setAttribute('stdDeviation', diff.join(' '));
      [previousX, previousY] = [easedProgress.x, easedProgress.y];
    }

    function resetMotionBlur() {
      element.style.filter = null;
      const svg = docRoot.querySelector('feGaussianBlur');
      svg.setAttribute('stdDeviation', '0 0');
    }

    function easingFactory() {
      // Visualized at https://easings.net/
      const easeInSine = (x) => 1 - Math.cos((x * Math.PI) / 2);
      const easeOutSine = (x) => Math.sin((x * Math.PI) / 2);
      const easeInOutSine = (x) => (-1 * (Math.cos(Math.PI * x) - 1)) / 2;
      const easeInCubic = (x) => x * x * x;
      const easeOutCubic = (x) => 1 - Math.pow(1 - x, 3);
      const easeInOutCubic = (x) =>
        x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
      const easeInQuint = (x) => x * x * x * x * x;
      const easeOutQuint = (x) => 1 - Math.pow(1 - x, 5);
      const easeInOutQuint = (x) =>
        x < 0.5 ? 16 * x * x * x * x * x : 1 - Math.pow(-2 * x + 2, 5) / 2;
      const easeInQuad = (x) => x * x;
      const easeOutQuad = (x) => 1 - (1 - x) * (1 - x);
      const easeInOutQuad = (x) =>
        x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
      const easeInQuart = (x) => x * x * x * x;
      const easeOutQuart = (x) => 1 - Math.pow(1 - x, 4);
      const easeInOutQuart = (x) =>
        x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2;
      const easeInExpo = (x) =>
        x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2;
      const easeOutExpo = (x) => (x === 1 ? 1 : 1 - Math.pow(2, -10 * x));
      const easeInOutExpo = (x) =>
        x === 0
          ? 0
          : x === 1
          ? 1
          : x < 0.5
          ? Math.pow(2, 20 * x - 10) / 2
          : (2 - Math.pow(2, -20 * x + 10)) / 2;
      const easeInCirc = (x) => 1 - Math.sqrt(1 - Math.pow(x, 2));
      const easeOutCirc = (x) => Math.sqrt(1 - Math.pow(x - 1, 2));
      const easeInOutCirc = (x) =>
        x < 0.5
          ? (1 - Math.sqrt(1 - Math.pow(2 * x, 2))) / 2
          : (Math.sqrt(1 - Math.pow(-2 * x + 2, 2)) + 1) / 2;
      const easeInBack = (x) => {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return c3 * x * x * x - c1 * x * x;
      };
      const easeOutBack = (x) => {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
      };
      const easeInOutBack = (x) => {
        const c1 = 1.70158;
        const c2 = c1 * 1.525;
        return x < 0.5
          ? (Math.pow(2 * x, 2) * ((c2 + 1) * 2 * x - c2)) / 2
          : (Math.pow(2 * x - 2, 2) * ((c2 + 1) * (x * 2 - 2) + c2) + 2) / 2;
      };
      const easeInElastic = (x) => {
        const c4 = (2 * Math.PI) / 3;
        return x === 0
          ? 0
          : x === 1
          ? 1
          : -Math.pow(2, 10 * x - 10) * Math.sin((x * 10 - 10.75) * c4);
      };
      const easeOutElastic = (x) => {
        const c4 = (2 * Math.PI) / 3;
        return x === 0
          ? 0
          : x === 1
          ? 1
          : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
      };
      const easeInOutElastic = (x) => {
        const c5 = (2 * Math.PI) / 4.5;
        return x === 0
          ? 0
          : x === 1
          ? 1
          : x < 0.5
          ? -(Math.pow(2, 20 * x - 10) * Math.sin((20 * x - 11.125) * c5)) / 2
          : (Math.pow(2, -20 * x + 10) * Math.sin((20 * x - 11.125) * c5)) / 2 +
            1;
      };
      const easeInBounce = (x) => 1 - easeOutBounce(1 - x);
      const easeOutBounce = (x) => {
        const n1 = 7.5625;
        const d1 = 2.75;
        if (x < 1 / d1) {
          return n1 * x * x;
        } else if (x < 2 / d1) {
          return n1 * (x -= 1.5 / d1) * x + 0.75;
        } else if (x < 2.5 / d1) {
          return n1 * (x -= 2.25 / d1) * x + 0.9375;
        } else {
          return n1 * (x -= 2.625 / d1) * x + 0.984375;
        }
      };
      const easeInOutBounce = (x) =>
        x < 0.5
          ? (1 - easeOutBounce(1 - 2 * x)) / 2
          : (1 + easeOutBounce(2 * x - 1)) / 2;

      return {
        easeInSine,
        easeOutSine,
        easeInOutSine,
        easeInCubic,
        easeOutCubic,
        easeInOutCubic,
        easeInQuint,
        easeOutQuint,
        easeInOutQuint,
        easeInQuad,
        easeOutQuad,
        easeInOutQuad,
        easeInQuart,
        easeOutQuart,
        easeInOutQuart,
        easeInExpo,
        easeOutExpo,
        easeInOutExpo,
        easeInCirc,
        easeOutCirc,
        easeInOutCirc,
        easeInBack,
        easeOutBack,
        easeInOutBack,
        easeInElastic,
        easeOutElastic,
        easeInOutElastic,
        easeInBounce,
        easeOutBounce,
        easeInOutBounce,
      };
    }
  });
}

export default motionBlur;
