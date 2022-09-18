export function compareDates(a: string | null, b: string | null, desc?: boolean): number;

export function compareDates(a: Date | string, b: Date | string, desc?: boolean): number;

export function compareDates(a: Date | string | null, b: Date | string | null, desc?: boolean): number {
    if (desc) {
        return getTime(b) - getTime(a);
    }
    return getTime(a) - getTime(b);
}

const getTime = (a: Date | string | null): number => {
    if (typeof a === "string") {
        return new Date(a).getTime();
    } else if (a === null) {
        return 0;
    }
    return a.getTime();
};
