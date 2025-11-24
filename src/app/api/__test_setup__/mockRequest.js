global.Request = class {
  constructor() {}
};
global.Response = class {
  constructor() {}
  static json(data, init) {
    return { data, init };
  }
  get cookies() {
    return {
      getSetCookie: () => [],
    };
  }
};
