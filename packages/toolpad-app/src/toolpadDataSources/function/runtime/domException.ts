try {
  // eslint-disable-next-line no-new
  new DOMException();
} catch (err) {
  // @ts-expect-error This is a best effort
  global.DOMException = class DOMException extends Error {
    constructor(message: string, name: string) {
      super(message);
      this.name = name;
    }
  };
}

export {};
