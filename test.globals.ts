export {};

// globals
declare global {
    interface Function {
        asMock(): jest.Mock;
    }
}

Function.prototype.asMock = function (): jest.Mock {
    return this as unknown as jest.Mock;
};
