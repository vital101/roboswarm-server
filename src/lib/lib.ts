export function asyncSleep(timeInSeconds: number): Promise<any> {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve();
        }, timeInSeconds * 1000);
    });
}