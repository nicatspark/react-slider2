import { useEffect } from 'react';

// Can be use separately without framework.
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
  const SET_COMPLEX = (obj) => {
    Object.keys(obj).forEach((key) => {
      const val = { ...store[key], current: obj[key] };
      const tempKeyVal = {};
      tempKeyVal[key] = val;
      window.global = { ...window.global, ...tempKeyVal };
    });
  };
  const REMOVE = (keyToDeleteObj) => {
    const temp = { ...store };
    Object.keys(keyToDeleteObj).forEach((key) => {
      delete temp[key];
    });
    window.global = { ...temp };
  };
  const ADD = (keyValueObj) =>
    !_stateKeyExist(keyValueObj)
      ? SET(keyValueObj)
      : console.error(`One or more keys already existed in state.`);
  const _pushToCssCustProp = ({ key, val }) => {
    if (!val.css) return;
    const cssFormat = (s) => s.toLowerCase().replace(/_/g, '-');
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
    SET_COMPLEX,
    REMOVE,
    _cssCustomPropRoot,
  };
};

export default microState;

// useMicroStateSync()
// Used to sync react local state to microState.
// add `useMicroStateSync({ zoomedOut });`
// will sync zoomedOut to ZOOMED_OUT in microState.
export function useMicroStateSync(varsObj) {
  const camelToSnakeUpperCase = (str) =>
    str.replace(/[A-Z]/g, (letter) => `_${letter}`).toUpperCase();
  const arr = Object.keys(varsObj);

  useEffect(() => {
    const { SET } = microState();
    const obj = {};
    arr.forEach((reactVar) => {
      obj[camelToSnakeUpperCase(reactVar)] = varsObj[reactVar];
    });
    SET(obj);
    // eslint-disable-next-line
  }, [...arr, varsObj, arr]);
}
