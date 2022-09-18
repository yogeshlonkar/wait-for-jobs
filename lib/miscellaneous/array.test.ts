import "./array";

describe("Array<T>", () => {
    test("remove returns removed element", () => {
        expect(new Array<string>("a", "b", "c").remove("c")).toBe("c");
    });

    test("remove returns undefined if element does not exist", () => {
        expect(new Array<string>("a", "b", "c").remove("d")).toBeUndefined();
    });

    test("isEmpty returns true if element is empty", () => {
        expect(new Array<string>().isEmpty()).toBeTruthy();
    });

    test("isEmpty returns false if element is not empty", () => {
        expect(new Array<string>("a").isEmpty()).toBeFalsy();
    });
});
