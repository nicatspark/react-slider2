const microState = () => {
  let store = window.global;
  const _cssCustomPropRoot = document.documentElement;
  const _stateKeyExist = (keyValueObj) =>
    Object.keys(keyValueObj)
      .map((key) => !!store[key])
      .some(Boolean);
  const SET = (keyValueObj) => {
    Object.keys(keyValueObj).forEach((key) => {
      // val can be simple number, partial object or full object.
      // full object => {current: 12, unit: 'px', css: true}
      const isObj = (val) => typeof val === 'object';
      const val = isObj(keyValueObj[key])
        ? { ...store[key], ...keyValueObj[key] }
        : { ...store[key], current: keyValueObj[key] };
      const tempKeyVal = {};
      tempKeyVal[key] = val;
      _pushToCssCustProp({ key, val });
      window.global = { ...window.global, ...tempKeyVal };
    });
  };
  const ADD = (keyValueObj) =>
    !_stateKeyExist(keyValueObj)
      ? SET(keyValueObj)
      : console.error(`One or more keys already existed in state.`);
  const _pushToCssCustProp = ({ key, val }) => {
    if (!val.css) return;
    const cssFormat = (s) => s.toLowerCase().replaceAll('_', '-');
    microState()._cssCustomPropRoot.style.setProperty(
      `--${cssFormat(key)}`,
      val.current + val.unit
    );
  };
  return {
    get STATE() {
      const simplifiedStore = {};
      Object.keys(store).forEach(
        (obj) => (simplifiedStore[obj] = store[obj].current)
      );
      return simplifiedStore;
    },
    ADD,
    SET,
    _cssCustomPropRoot,
  };
};

export default microState;
