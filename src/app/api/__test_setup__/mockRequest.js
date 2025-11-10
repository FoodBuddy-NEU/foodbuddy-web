global.Request = class {
  constructor(...args) {}
};
global.Response = class {
  constructor(...args) {}
  static json(data, init) {
    return { data, init };
  }
  get cookies() {
    return {
      getSetCookie: () => [],
    };
  }
};
