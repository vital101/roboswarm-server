import * as swig from "swig";
import { execSync } from "child_process";
import { readFileSync, writeFileSync } from "fs";
import { v1 as generateUUID } from "uuid";
import { asyncReadFile } from "../lib/lib";
import * as Swarm from "../models/Swarm";
import * as LoadTestTemplate from "../models/LoadTestTemplate";
import * as LoadTestFile from "../models/LoadTestFile";
import * as WooCommerce from "../models/WooCommerce";
import * as Handlebars from "handlebars";
import * as handlebarsHelpers from "../lib/handlebarsHelpers";

// Handlebars custom helpers.
Handlebars.registerHelper("getBodyType", handlebarsHelpers.getBodyType);
Handlebars.registerHelper("getBodyValue", handlebarsHelpers.getBodyValue);
Handlebars.registerHelper("getId", handlebarsHelpers.getId);
Handlebars.registerHelper("ifEquals", handlebarsHelpers.ifEquals);
Handlebars.registerHelper("joinQueryParams", handlebarsHelpers.joinQueryParams);

// Swig custom helpers
swig.setFilter("increment", input => {
    return input + 1;
});

const appRoot = process.env.APP_ROOT || "/Users/jackslingerland/repos/roboswarm";

interface SwigTemplateContext {
    username: string;
    password: string;
    wp_login_path: string;
    authenticated_backend: LoadTestTemplate.TemplateRoute[];
    authenticated_frontend: LoadTestTemplate.TemplateRoute[];
    unauthenticated_frontend: LoadTestTemplate.TemplateRoute[];
}

export function getRoutePath(path: string): string {
    return path[0] === "/" ? path : `/${path}`;
}

export async function generateLocustFile(templateId: number, isWooTemplate: boolean, isAdvancedRouteTemplate: boolean, swarm: Swarm.Swarm): Promise<string> {
    if (isWooTemplate) {
        const template = await WooCommerce.getById(templateId);
        const templatePath = `${appRoot}/swig-templates/woocommerce.template.py`;
        console.log(`Generating WooCommerce template from ${templatePath}`);
        const renderContext = {
            shop_url: getRoutePath(template.shop_url),
            cart_url: getRoutePath(template.cart_url),
            checkout_url: getRoutePath(template.checkout_url),
            product_a_url: getRoutePath(template.product_a_url),
            product_b_url: getRoutePath(template.product_b_url)
        };
        const compiledTemplate = swig.renderFile(templatePath, renderContext);
        return compiledTemplate;
    } else if (isAdvancedRouteTemplate) {
        const template: LoadTestTemplate.TemplateBlob = await LoadTestTemplate.getTemplateBlobById(swarm.user_id, swarm.group_id, templateId);
        const templatePath = `${appRoot}/swig-templates/advanced-route.handlebars`;
        const templateString = readFileSync(templatePath).toString();
        const templateCompiler = Handlebars.compile(templateString);
        const renderContext = JSON.parse(template.template);
        return templateCompiler(renderContext);
    } else {
        const template = await LoadTestTemplate.getById(templateId);
        const renderContext: SwigTemplateContext = {
            username: template.username,
            password: template.password,
            wp_login_path: getRoutePath("wp-login.php"),
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
                    path: getRoutePath(r.path),
                    id: idx + 1
                };
            });
        }

        const hasAuthenticatedFrontend = routes.find(f => f.routeType === LoadTestTemplate.WordPressRouteType.AUTHENTICATED_FRONTEND_NAVIGATE);
        if (hasAuthenticatedFrontend) {
            renderContext.authenticated_frontend = hasAuthenticatedFrontend.routes.map((r, idx) => {
                return {
                    ...r,
                    path: getRoutePath(r.path),
                    id: idx + 1
                };
            });
        }

        const hasUnauthenticatedFrontend = routes.find(f => f.routeType === LoadTestTemplate.WordPressRouteType.UNAUTHENTICATED_FRONTEND_NAVIGATE);
        if (hasUnauthenticatedFrontend) {
            renderContext.unauthenticated_frontend = hasUnauthenticatedFrontend.routes.map((r, idx) => {
                return {
                    ...r,
                    path: getRoutePath(r.path),
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

export async function generateLocustFileZip(templateId: number, isWooTemplate: boolean, isAdvancedRouteTemplate: boolean, swarm: Swarm.Swarm): Promise<string> {
    const compiledTemplate = await generateLocustFile(templateId, isWooTemplate, isAdvancedRouteTemplate, swarm);
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

export async function generateAndSaveTemplate(swarm_id: number, template_id: number, is_woo_template: boolean, is_advanced_route_template: boolean): Promise<number> {
    const swarm = await Swarm.getById(swarm_id);
    const zipFilePath = await generateLocustFileZip(template_id, is_woo_template, is_advanced_route_template, swarm);
    const fileBuffer = await asyncReadFile(zipFilePath);
    const ltFile: LoadTestFile.LoadTestFile = await LoadTestFile.create({
        swarm_id,
        lt_file: fileBuffer
    });
    return ltFile.id;
}