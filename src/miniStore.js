const miniStore = {
  _stateObj: Object.freeze({}),
  _callbackObj: {},
  _internal: {
    initiated: false,
    history: {},
    fatalError: false,
    get stateHasErrors() {
      if (this.fatalError) {
        throw new Error('The state is compromised.');
      } else return false;
    },
    isCallback: function (key) {
      return /_callback$/.test(key);
    },
    hasCallbacks: function (state) {
      return !!Object.keys(state).filter((key) => /_callback$/.test(key))
        .length;
    },
  },
  set INIT(initialState) {
    if (this._internal.initiated) {
      console.error('The miniStore is already initiated.');
      this._internal.fatalError = true;
      return;
    }
    if (this._internal.hasCallbacks(initialState)) {
      console.error('Add callbacks separately using SET instead.');
      this._internal.fatalError = true;
      return;
    }
    this._stateObj = { ...this._stateObj, ...initialState };
    this._internal.initiated = true;
  },
  get STATE() {
    if (this._internal.stateHasErrors) return {};
    return this._stateObj;
  },
  set SET(partialState) {
    if (this._internal.stateHasErrors) return;
    // Find and store callback functions.
    Object.keys(partialState).forEach((keyCB) => {
      if (this._internal.isCallback(keyCB)) {
        if (!this._stateObj[keyCB.replace('_callback', '')])
          throw new Error(
            `Can not set a callback because original state property doesn't exist.`
          );
        const newKeyValue = {};
        newKeyValue[keyCB] = partialState[keyCB];
        this._callbackObj = { ...this._callbackObj, ...newKeyValue };
        // TODO: Add oldValue and newValue to callback function.
      }
    });
    // Update state.
    Object.keys(partialState).forEach((key) => {
      if (!this._internal.isCallback(key)) {
        const oldValue = this._stateObj[key];
        const newValue = partialState[key];
        const { historyArray } = storeInHistory(
          key,
          this._internal.history,
          oldValue
        );
        const newKeyValue = {};
        newKeyValue[key] = newValue;
        this._stateObj = Object.freeze({ ...this._stateObj, ...newKeyValue });
        // Check if there is a callback for this change.
        if (this._callbackObj[`${key}_callback`]) {
          console.assert(
            (typeof this._callbackObj[`${key}_callback`]).toString() ===
              'function',
            'A callback need to be a function.'
          );
          this._callbackObj[`${key}_callback`].call(this, {
            oldValue,
            newValue,
            historyArray,
          });
        }
        function storeInHistory(key, history, previousValue) {
          history[key] = history[key] || [];
          if (previousValue ?? false)
            history[key] = [...history[key], previousValue];
          return {
            historyArray: history[key],
          };
        }
      }
    });
  },
  set DELETE(key) {
    if (this._internal.stateHasErrors) return;
    immutableDeleteKey.call(this, this, '_stateObj', key);
    immutableDeleteKey.call(
      this,
      this,
      '_callbackObj',
      null,
      `${key}_callback`
    );
    immutableDeleteKey.call(this, this._internal, 'history', key);
    function immutableDeleteKey(root, sub, key) {
      const temp = { ...root[sub] };
      delete temp[key];
      root[sub] = temp;
    }
  },
  set REMOVE_CALLBACK(key) {
    if (this._internal.stateHasErrors) return;
    if (this._callbackObj[`${key}_callback`]) {
      const temp = { ...this._callbackObj };
      delete temp[`${key}_callback`];
      this._callbackObj = temp;
    }
  },
};

export default miniStore;
