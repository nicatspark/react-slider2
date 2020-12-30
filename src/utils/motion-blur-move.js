async function motionBlur(
  element,
  {
    durationMs = 1000,
    properties = [],
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
    const noMovement = !!properties.filter((prop) => prop.start === prop.end)
      .length;
    if (noMovement) resolve({ element });
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
      const isSimpleValueUnit = (cssVal_arr) =>
        cssVal_arr
          .map((cssVal) => cssVal && !isNaN(parseInt(cssVal)))
          .some(Boolean);
      // forEach of the multiple properties being sent in.
      const allPropertyTasks = [];
      //prettier-disable-next-line
      const regexFloatNr = new RegExp('([-]*[0-9\\.]+)', 'g');
      properties.forEach((prop) => {
        const oneAnimateProperty = {
          property: prop.property,
          orig_start: prop.start,
          orig_end: prop.end,
          start_nr_arr: prop.start.match(regexFloatNr).map((x) => +x),
          start_nr_wrap: prop.start.replace(regexFloatNr, '|').split('|'),
          end_nr_arr: prop.end.match(regexFloatNr).map((x) => +x),
          end_nr_wrap: prop.end.replace(regexFloatNr, '|').split('|'),
          easedDistance_arr: [],
          easedPropVal: '',
          unit: filterOutUnitFromCssKeyValueArr([prop.start, prop.end]),
        };
        // Are there multiple values in one propvalue, as in 'translate(12px,34px)'?
        if (
          !isSimpleValueUnit([
            oneAnimateProperty.orig_start,
            oneAnimateProperty.orig_end,
          ])
        ) {
          // For each nr in a prop value, as in translate(12px,24px)
          oneAnimateProperty.start_nr_arr.forEach((nr, i) => {
            const targetDistance = oneAnimateProperty.end_nr_arr[i] - nr;
            const easeDist = easings[easing](linearProgress) * targetDistance;
            oneAnimateProperty.easedDistance_arr.push(easeDist);
          });
          // Build it back together with easing added.
          oneAnimateProperty.start_nr_wrap.forEach((wrap, i) => {
            const easeDist = oneAnimateProperty.easedDistance_arr[i];
            const startPos = oneAnimateProperty.start_nr_arr[i];
            const unit = oneAnimateProperty.unit;
            const newPropVal =
              removeOldUnit(wrap) +
              (isNaN(easeDist) ? '' : startPos + easeDist + unit);
            oneAnimateProperty.easedPropVal += newPropVal;
          });
        } else {
          // It is a simple propvalue like: 12px.
          const targetDistance = parseInt(prop.end) - parseInt(prop.start);
          const easeDist = easings[easing](linearProgress) * targetDistance;
          console.log('easeDist', easeDist);
          oneAnimateProperty.easedDistance_arr.push(easeDist);
          const unit = oneAnimateProperty.unit;
          const startPos = oneAnimateProperty.start_nr_arr[0];
          oneAnimateProperty.easedPropVal = startPos + easeDist + unit;
        }
        allPropertyTasks.push(oneAnimateProperty);
      });
      // If motion blur is applied it will be based on max values on each axis velocity.
      const motionBlurValidDistances = { x: [], y: [] };
      allPropertyTasks.forEach((propobj) => {
        element.style[propobj.property] = propobj.easedPropVal;
        if (isValidForMotionBlur(propobj)) {
          // Set to do motion blur.
          if (
            ['left', 'right'].includes(propobj.property.toLowerCase()) ||
            catchTranslateX(propobj)
          )
            motionBlurValidDistances.x.push(propobj.easedDistance_arr[0]);
          else motionBlurValidDistances.y.push(propobj.easedDistance_arr[0]);
        }
      });
      // Apply motion blur if applicable.
      if (
        useMotionBlur &&
        (motionBlurValidDistances.x.length || motionBlurValidDistances.y.length)
      ) {
        applyMotionBlur({
          x: motionBlurValidDistances.x.length
            ? Math.max([...motionBlurValidDistances.x])
            : 0,
          y: motionBlurValidDistances.y
            ? Math.max([...motionBlurValidDistances.y])
            : 0,
        });
      }

      // Helper functions. Typically from em),rem),px),etc.
      function removeOldUnit(wrap) {
        // Unit followed by end parentesis or comma.
        const regex = new RegExp('^[a-zA-Z]{2,3}(?=[\\),])');
        return wrap.replace(regex, '');
      }

      function filterOutUnitFromCssKeyValueArr(arr) {
        // Simple css values as '12px'.
        const hasSimpleValue = arr.some((kv) => !isNaN(parseInt(kv)));
        const assert = (uniqueUnits) => {
          console.assert(
            uniqueUnits.length === 1,
            `Seems more than one unit is used (${uniqueUnits.join()}) in start and end. That won't work.`
          );
        };
        if (hasSimpleValue) {
          const unitArr = arr.reduce((acc, valueUnit) => {
            console.log('regexFloatNr', regexFloatNr);
            const unit = valueUnit.replace(regexFloatNr, '');
            unit ? acc.push(unit) : void 0;
            return acc;
          }, []);
          const uniqueUnits = [...new Set(unitArr)];
          assert(uniqueUnits);
          return uniqueUnits[0];
        }
        // Complex css values as 'translate(12px,24px)'.
        let finalUnit;
        arr.forEach((kv) => {
          if (!kv) return;
          // eslint-disable-next-line
          const parentesisContentArr = kv.match(/\(([^\)]*)\)/)[1].split(','); // ['12px','34px']
          const arrayOfUnitsOnly = parentesisContentArr.map((nu) =>
            nu.replace(regexFloatNr, '')
          );
          const removedFalseys = arrayOfUnitsOnly.filter(Boolean);
          const uniqueUnits = [...new Set(removedFalseys)];
          assert(uniqueUnits);
          finalUnit = uniqueUnits[0];
        });
        return finalUnit;
      }

      function catchTranslateX(propobj) {
        return /(^(translatex))/.test(propobj.start_nr_wrap[0].toLowerCase());
      }

      function isValidForMotionBlur(propobj) {
        // Motion across the screen.
        return (
          ['left', 'right', 'top', 'bottom'].includes(
            propobj.property.toLowerCase()
          ) ||
          (['transform'].includes(propobj.property.toLowerCase()) &&
            ['translatex', 'translatey'].filter(
              (x) => propobj.start_nr_wrap[0].toLowerCase().indexOf(x) >= 0
            ).length)
        );
      }

      if (elapsedMs < durationMs) {
        window.requestAnimationFrame(step); // Keep going.
      } else {
        // Movement done.
        if (useMotionBlur) resetMotionBlur();
        allPropertyTasks.forEach((propToAnimate) => {
          element.style[propToAnimate.property] = propToAnimate.orig_end;
        });
        resolve({ element });
      }
    }
    window.requestAnimationFrame(step); // Kicking things off.

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
      // Function that creates the blur motion svg.
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
      // Connect target element w motion blur svg.
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
        const c1 = 1.00158; // Originally 1.70158
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
