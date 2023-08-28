import { request, RequestOptions as httpsRequestOptions } from "https";
import { URL } from "url";

export interface RequestOptions {
    method: "GET" | "POST" | "DELETE";
    url: string;
    headers?: { [key: string]: string };
    body?: any;
    responseType?: "HTML" | "JSON";
}

/**
 * Makes an HTTP request and returns a promise that resolves with the response data.
 *
 * @template T The expected type of the response data.
 * @param {RequestOptions} options Configuration options for the HTTP request.
 * @param {('GET' | 'POST' | 'DELETE')} options.method The HTTP method to use for the request.
 * @param {string} options.url The full URL to which the request should be made.
 * @param {Object} [options.headers] Any additional headers to include in the request.
 * @param {any} [options.body] Data to be sent in the body of the request (used for POST requests).
 * @param {('HTML' | 'JSON)} options.responseType The expected response type. If JSON, will return JSON object.
 *
 * @returns {Promise<T>} A promise that resolves with the response data or rejects with an error.
 *
 * @example
 * const data = await httpRequest<{ id: number, name: string }>({
 *     method: 'GET',
 *     url: 'https://api.example.com/data'
 * });
 * console.log(data.name);
 */
export function httpRequest<T>(options: RequestOptions): Promise<T> {
    const url = new URL(options.url);

    return new Promise<T>((resolve, reject) => {
        const httpOptions: httpsRequestOptions = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: options.method,
            headers: options.headers || {},
            rejectUnauthorized: false
        };

        if (options.method === "POST" && options.body) {
            httpOptions.headers["Content-Type"] = "application/json";
        }

        const req = request(httpOptions, res => {
            let data = "";

            res.on("data", (chunk) => {
                data += chunk;
            });

            res.on("end", () => {
                if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                    if (options.responseType === "JSON") {
                        resolve(JSON.parse(data));
                    } else {
                        resolve(data as any);
                    }
                } else {
                    reject(new Error(`HTTP error! Status: ${res.statusCode}, Response: ${data}`));
                }
            });
        });

        req.on("error", (error) => {
            reject(error);
        });

        if (options.method === "POST" && options.body) {
            req.write(JSON.stringify(options.body));
        }

        req.end();
    });
}