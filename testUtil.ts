export {};

declare global {
    interface Function {
        asMock(): jest.Mock;
    }
}

Function.prototype.asMock = function (): jest.Mock {
    return this as jest.Mock;
};
