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

    // Try regular sitemaps
    const sm = new SiteMapper({ url: sitemapUrl });
    const sites: SitemapperResponse = await sm.fetch();
    if (sites.sites.length !== 0) {
        return sites.sites.map(site => {
            return {
                path: site.replace(url, ""),
                method: "GET"
            };
        });
    } else {
        const yoastUrl = `${url}/sitemap_index.xml`;
        const smYoast = new SiteMapper({
            url: yoastUrl,
            concurrency: 1,
            debug: true,
            rejectUnauthorized: false,
            timeout: 60000, // 1 minute
            requestHeaders: {
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:95.0) Gecko/20100101 Firefox/95.0"
            },
        });
        const yoastSites: SitemapperResponse = await smYoast.fetch();
        return yoastSites.sites.map(site => {
            return {
                path: site.replace(url, ""),
                method: "GET"
            };
        });
    }
}