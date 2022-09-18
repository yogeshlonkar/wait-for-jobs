/**
 * Duration in `1d2h3m4s` format between dates
 *
 * @param since
 * @param now
 */
export const duration = (since: Date, now = new Date()): string => {
    let dur = "";
    let delta = Math.abs(now.getTime() - since.getTime()) / 1000;
    const days = Math.floor(delta / 86400);
    if (days > 0) {
        dur += `${days}d`;
    }
    delta -= days * 86400;
    const hours = Math.floor(delta / 3600) % 24;
    if (hours + days > 0) {
        dur += `${hours}h`;
    }
    delta -= hours * 3600;
    const minutes = Math.floor(delta / 60) % 60;
    if (minutes + hours + days > 0) {
        dur += `${minutes}m`;
    }
    delta -= minutes * 60;
    const seconds = (delta % 60).toFixed(0);
    if (minutes + hours + days > 0 || seconds !== "0") {
        dur += `${seconds}s`;
    }
    return dur;
};
