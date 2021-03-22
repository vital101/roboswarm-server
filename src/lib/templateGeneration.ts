import * as swig from "swig";
import { execSync } from "child_process";
import { writeFileSync } from "fs";
import { v1 as generateUUID } from "uuid";
import { asyncReadFile } from "../lib/lib";
import * as Swarm from "../models/Swarm";
import * as LoadTestTemplate from "../models/LoadTestTemplate";
import * as LoadTestFile from "../models/LoadTestFile";
import * as WooCommerce from "../models/WooCommerce";

swig.setFilter("increment", input => {
    return input + 1;
});

const appRoot = process.env.NODE_ENV === "production"
    ? "/var/www/roboswarm/current"
    : "/Users/jackslingerland/repos/roboswarm";

interface SwigTemplateContext {
    username: string;
    password: string;
    authenticated_backend: LoadTestTemplate.TemplateRoute[];
    authenticated_frontend: LoadTestTemplate.TemplateRoute[];
    unauthenticated_frontend: LoadTestTemplate.TemplateRoute[];
}

export function getRoutePath(baseUrl: string, path: string): string {
    let output;
    if (baseUrl[baseUrl.length - 1] === "/") {
        // If baseUrl has a trailing slash make sure path does not start with one.
        output = path[0] === "/" ? path.substring(1) : path;
    } else {
        // If baseUrl does not have trailing slash, make sure path starts with one
        output = path[0] !== "/" ? `/${path}` : path;
    }
    return output;
}

export async function generateLocustFile(templateId: number, isWooTemplate: boolean, swarm: Swarm.Swarm): Promise<string> {
    if (isWooTemplate) {
        const template = await WooCommerce.getById(templateId);
        const templatePath = `${appRoot}/swig-templates/woocommerce.template.py`;
        console.log(`Generating WooCommerce template from ${templatePath}`);
        const renderContext = {
            shop_url: getRoutePath(swarm.host_url, template.shop_url),
            cart_url: getRoutePath(swarm.host_url, template.cart_url),
            checkout_url: getRoutePath(swarm.host_url, template.checkout_url),
            product_a_url: getRoutePath(swarm.host_url, template.product_a_url),
            product_b_url: getRoutePath(swarm.host_url, template.product_b_url)
        };
        const compiledTemplate = swig.renderFile(templatePath, renderContext);
        return compiledTemplate;
    } else {
        const template = await LoadTestTemplate.getById(templateId);
        const renderContext: SwigTemplateContext = {
            username: template.username,
            password: template.password,
            authenticated_backend: undefined,
            authenticated_frontend: undefined,
            unauthenticated_frontend: undefined
        };
        const routes = template.routes as LoadTestTemplate.WordPressRoute[];

        const hasAuthenticatedBackend = routes.find(f => f.routeType === LoadTestTemplate.WordPressRouteType.AUTHENTICATED_ADMIN_NAVIGATE);
        if (hasAuthenticatedBackend) {
            renderContext.authenticated_backend = hasAuthenticatedBackend.routes.map((r, idx) => {
                return {
                    ...r,
                    path: getRoutePath(swarm.host_url, r.path),
                    id: idx + 1
                };
            });
        }

        const hasAuthenticatedFrontend = routes.find(f => f.routeType === LoadTestTemplate.WordPressRouteType.AUTHENTICATED_FRONTEND_NAVIGATE);
        console.log({ routes });
        if (hasAuthenticatedFrontend) {
            renderContext.authenticated_frontend = hasAuthenticatedFrontend.routes.map((r, idx) => {
                return {
                    ...r,
                    path: getRoutePath(swarm.host_url, r.path),
                    id: idx + 1
                };
            });
        }

        const hasUnauthenticatedFrontend = routes.find(f => f.routeType === LoadTestTemplate.WordPressRouteType.UNAUTHENTICATED_FRONTEND_NAVIGATE);
        if (hasUnauthenticatedFrontend) {
            renderContext.unauthenticated_frontend = hasUnauthenticatedFrontend.routes.map((r, idx) => {
                return {
                    ...r,
                    path: getRoutePath(swarm.host_url, r.path),
                    id: idx + 1
                };
            });
        }
        const templatePath = `${appRoot}/swig-templates/locustfile.template.py`;
        console.log(`Generating template from ${templatePath}`);
        const compiledTemplate = swig.renderFile(templatePath, renderContext);
        return compiledTemplate;
    }
}

async function generateRequirementsFile(): Promise<string> {
    const templatePath = `${appRoot}/swig-templates/requirements.template.txt`;
    console.log(`Generating requirements from ${templatePath}`);
    const compiledTemplate = swig.renderFile(templatePath);
    return compiledTemplate;
}

export async function generateLocustFileZip(templateId: number, isWooTemplate: boolean, swarm: Swarm.Swarm): Promise<string> {
    const compiledTemplate = await generateLocustFile(templateId, isWooTemplate, swarm);
    const compiledRequirements = await generateRequirementsFile();
    const directoryUUID = generateUUID();
    const directory = `/tmp/roboswarm-${directoryUUID}`;
    execSync(`mkdir -p ${directory}`, { cwd: "/tmp" });
    writeFileSync(`${directory}/locustfile.py`, compiledTemplate);
    writeFileSync(`${directory}/requirements.txt`, compiledRequirements);
    execSync(`zip -9 -j -r load-test.zip ${directory}/`, { cwd: directory });
    const zipFilePath = `${directory}/load-test.zip`;
    const zipFileDir = `${generateUUID()}`;
    const zipFileNewPathName = `${generateUUID()}.zip`;
    const saveFilePath = "/tmp/";
    execSync(`mkdir -p ${saveFilePath}${zipFileDir}`, { cwd: "/tmp" });
    execSync(`mv ${zipFilePath} ${saveFilePath}${zipFileDir}/${zipFileNewPathName}`, { cwd: "/tmp" });
    execSync(`rm -rf ${directory}`, { cwd: "/tmp" });
    console.log(`Returning: ${saveFilePath}${zipFileDir}/${zipFileNewPathName}`);
    return `${saveFilePath}${zipFileDir}/${zipFileNewPathName}`;
}

export async function generateAndSaveTemplate(swarm_id: number, template_id: number, is_woo_template: boolean): Promise<number> {
    const swarm = await Swarm.getById(swarm_id);
    const zipFilePath = await generateLocustFileZip(template_id, is_woo_template, swarm);
    const fileBuffer = await asyncReadFile(zipFilePath);
    const ltFile: LoadTestFile.LoadTestFile = await LoadTestFile.create({
        swarm_id,
        lt_file: fileBuffer
    });
    return ltFile.id;
}