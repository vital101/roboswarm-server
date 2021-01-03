import { resolveTxt } from "dns";
import { db } from "../lib/db";
import { v4 as generateUUID } from "uuid";
import * as request from "request-promise";
import * as cheerio from "cheerio";

export interface SiteOwnership {
    id?: number;
    group_id: number;
    user_id: number;
    base_url: string;
    uuid?: string;
    verified: boolean;
    created_at: Date;
}

export async function create(site: SiteOwnership): Promise<SiteOwnership> {
    const rows: SiteOwnership[] = await db("site_ownership")
        .insert({
            ...site,
            verified: false,
            uuid: generateUUID()
        })
        .returning("*");
    return rows[0];
}

export async function deleteById(id: number): Promise<void> {
    await db("site_ownership")
        .where({ id })
        .delete();
}

export async function find(fields: Object): Promise<SiteOwnership[]> {
    const rows: SiteOwnership[] = await db("site_ownership").where(fields);
    return rows;
}

export async function findById(id: number): Promise<SiteOwnership> {
    const results: SiteOwnership[] = await find({ id });
    if (results && results.length === 1) {
        return results[0];
    } else {
        return undefined;
    }
}

export async function update(where: Object, fieldsToUpdate: Object): Promise<SiteOwnership[]> {
    const rows: SiteOwnership[] = await db("site_ownership")
        .update(fieldsToUpdate)
        .where(where)
        .returning("*");
    return rows;
}

function resolveTxtWrapper(domain: string): Promise<any> {
    return new Promise((resolve, reject) => {
        resolveTxt(domain, (err: NodeJS.ErrnoException, addresses: string[][]) => {
            if (err) {
                reject();
            } else {
                resolve(addresses);
            }
        });
    });
}

export async function verify(siteToVerify: SiteOwnership): Promise<SiteOwnership> {
    const domain: string = siteToVerify.base_url
        .replace("https://", "")
        .replace("http://", "")
        .replace("/", "");
    let verified = false;
    try {
        // First attempt to verify via DNS text records.
        const addresses: string[][] = await resolveTxtWrapper(domain);
        const matchRegex = new RegExp(/^load-test-verify-(?<uuid>.+)$/);
        for (const address of addresses) {
            const [txtRecord] = address;
            const matchedValues: RegExpMatchArray = txtRecord.match(matchRegex);
            if (matchedValues && matchedValues.groups && matchedValues.groups.uuid) {
                const uuidToCheck: string = matchedValues.groups.uuid;
                if (siteToVerify.uuid === uuidToCheck) {
                    await update({ id: siteToVerify.id }, { verified: true });
                    verified = true;
                }
            }
        }
    } catch (err) { /* no-op */ }

    try {
        // Second attempt to verify via <meta> tags.
        const resultHTML: string = await request.get(siteToVerify.base_url, { strictSSL: false });
        const $ = cheerio.load(resultHTML);
        const metaTags = $('meta[name ="roboswarm-verify"]');
        if (metaTags.length > 0) {
            const code: string = metaTags[0].attribs.content;
            if (code === siteToVerify.uuid) {
                await update({ id: siteToVerify.id }, { verified: true });
                verified = true;
            }
        }
        return {
            ...siteToVerify,
            verified,
        };
    } catch (err) { /* no-op */ }

    return siteToVerify;
}

export async function getSiteIdByBaseUrl(base_url: string): Promise<number|boolean> {
    const site: SiteOwnership = await db("site_ownership")
        .where({ base_url })
        .first();
    return site ? site.id : false;
}