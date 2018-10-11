export function asyncSleep(timeInSeconds: number): Promise<any> {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, timeInSeconds * 1000);
    });
}