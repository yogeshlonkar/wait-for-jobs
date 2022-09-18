export {};

declare global {
    export interface Array<T> {
        /**
         * Remove item from {@link Array}
         *
         * @param item of array to remove
         * @return true if found in array
         */
        remove(item: T): T;

        /**
         * Checks if Array is empty
         */
        isEmpty(): boolean;
    }
}

Array.prototype.remove = function (item) {
    const index = this.indexOf(item);
    if (index > -1) {
        const [removed] = this.splice(index, 1);
        return removed;
    }
    return undefined;
};

Array.prototype.isEmpty = function (): boolean {
    return this.length === 0;
};
