import SiteMapper, { SitemapperResponse } from "sitemapper";

export interface SitemapRoute {
    path: string;
    method: string;
}

export async function getSitesFromSitemap(url: string): Promise<SitemapRoute[]> {
    let sitemapUrl: string;
    if (url.includes("sitemap.xml") || url.includes("sitemap_index.xml")) {
        sitemapUrl = url;
    } else {
        sitemapUrl = `${url}/sitemap.xml`;
    }
    const sm = new SiteMapper({ url: sitemapUrl });
    const sites: SitemapperResponse = await sm.fetch();
    return sites.sites.map(site => {
        return {
            path: site.replace(url, ""),
            method: "GET"
        };
    });
}