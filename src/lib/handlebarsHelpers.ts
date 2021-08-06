export function getBodyType(bodyType: string): string {
    if (bodyType === "application/json") {
        return "json=data,";
    } else {
        return "data,";
    }
}

export function getBodyValue(bodyValue: number|string): string|number {
    try {
        const val: number = Number(bodyValue);
        return isNaN(val) ? `"${bodyValue}"` : val;
    } catch (err) {
        return `"${bodyValue}"`;
    }
}

export function getId(id: string): string {
    return id.replace(/-/g, "_");
}

export function ifEquals(arg1: any, arg2: any, options: any) {
    return (arg1 === arg2) ? options.fn(this) : options.inverse(this);
}

export function joinQueryParams(arr: Array<any>, separator: string): string {
    if (typeof arr === "string") return arr;
    if (!Array.isArray(arr)) return "";
    separator = separator ? separator : ", ";
    if (arr.length > 0) {
        return "?" + arr
            .map(item => `${item.key}=${item.value}`)
            .join(separator);
    } else {
        return "";
    }
}