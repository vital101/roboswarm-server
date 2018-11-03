import { readdirSync, statSync } from "fs";

export function asyncSleep(timeInSeconds: number): Promise<any> {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, timeInSeconds * 1000);
    });
}

export function getIndexPath(): string {
    if (process.env.NODE_ENV === "production") {
        const directories: string[] = getDirectories("/var/www/roboswarm-static");
        const timestamps: number[] = directories.map(d => parseInt(d, 10));
        const timestampsDescending: number[] = timestamps.sort().reverse();
        return `/var/www/roboswarm-static/${timestampsDescending[0]}/index.html`;
    } else {
        return "";
    }
}

function getDirectories(path: string): string[] {
    return readdirSync(path).filter(function (file) {
        return statSync(path + "/" + file).isDirectory();
    });
}