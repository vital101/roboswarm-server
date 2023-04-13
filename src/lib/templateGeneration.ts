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
import * as SwarmMachine from "../models/SwarmMachine";

// Handlebars custom helpers.
Handlebars.registerHelper("getBodyType", handlebarsHelpers.getBodyType);
Handlebars.registerHelper("getBodyValue", handlebarsHelpers.getBodyValue);
Handlebars.registerHelper("getId", handlebarsHelpers.getId);
Handlebars.registerHelper("ifHasUsers", handlebarsHelpers.hasUsers);
Handlebars.registerHelper("ifEquals", handlebarsHelpers.ifEquals);
Handlebars.registerHelper("joinQueryParams", handlebarsHelpers.joinQueryParams);

// Swig custom helpers
swig.setFilter("increment", input => {
    return input + 1;
});

const appRoot = process.env.ROBOSWARM__APP_ROOT || "/Users/jackslingerland/repos/roboswarm";

// VM Configuration Compiler
const templatePath = `${appRoot}/swig-templates/configure-vm.sh`;
console.log({ templatePath });
const templateString = readFileSync(templatePath).toString();
const vmConfigTemplateCompiler = Handlebars.compile(templateString);

interface SwigTemplateContext {
    username: string;
    password: string;
    wp_login_path: string;
    authenticated_backend: LoadTestTemplate.TemplateRoute[];
    authenticated_frontend: LoadTestTemplate.TemplateRoute[];
    unauthenticated_frontend: LoadTestTemplate.TemplateRoute[];
}

interface WooCommerceAttribute {
    name: string;
    value: any;
}

export function getRoutePath(path: string): string {
    return path[0] === "/" ? path : `/${path}`;
}

export function getAttributes(path: string): WooCommerceAttribute[] {
    const urlParts = path.split("?");
    if (urlParts.length === 2) {
        const queryParams = new URLSearchParams(urlParts[1]);
        const attributes: WooCommerceAttribute[] = [];
        for (const pair of queryParams.entries()) {
            const attribute: WooCommerceAttribute = {
                name: pair[0],
                value: pair[1]
            };
            attributes.push(attribute);
        }
        return attributes;
    } else {
        return [];
    }
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
            product_b_url: getRoutePath(template.product_b_url),
            product_a_attributes: getAttributes(template.product_a_url),
            product_b_attributes: getAttributes(template.product_b_url),
            data_override: template.data_override
        };
        const compiledTemplate = swig.renderFile(templatePath, renderContext);
        return compiledTemplate;
    } else if (isAdvancedRouteTemplate) {
        const template: LoadTestTemplate.TemplateBlob = await LoadTestTemplate.getTemplateBlobById(swarm.user_id, swarm.group_id, templateId);
        let templatePath: string;
        if (swarm.user_traffic_behavior === "evenSpread") {
            templatePath = `${appRoot}/swig-templates/advanced-route.handlebars`;
        } else {
            templatePath = `${appRoot}/swig-templates/advanced-route-sequence.handlebars`;
        }
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

export async function generateVmConfigurationScript(machine_id: number): Promise<string> {
    const swarmId = await SwarmMachine.getSwarmIdByMachineId(machine_id);
    const swarm = await Swarm.getById(swarmId);
    console.info("===== SWARM =====");
    console.log(swarm);
    const users = swarm.simulated_users;
    const rate = swarm.spawn_rate;
    const runTime = `${swarm.duration}m`;
    const hostUrl: string = swarm.host_url[swarm.host_url.length - 1] === "/" ?
        swarm.host_url.slice(0, -1) :
        swarm.host_url;
    let expectSlaveCount;
    const slaveCount = swarm.size - 1;
    if (slaveCount === 1) {
        expectSlaveCount = 1;
    } else if (slaveCount > 1 && slaveCount <= 5) {
        expectSlaveCount = slaveCount - 1;
    } else if (slaveCount > 5 && slaveCount <= 12) {
        expectSlaveCount = slaveCount - 2;
    } else {
        expectSlaveCount = Math.floor(slaveCount * 0.85);
    }

    const renderContext = {
        baseUrl: process.env.ROBOSWARM__BASE_URL ? process.env.ROBOSWARM__BASE_URL : "https://roboswarm.dev",
        machineId: machine_id,
        users,
        rate,
        runTime,
        expectSlaveCount: expectSlaveCount > 0 ? expectSlaveCount : 1,
        hostUrl,
        basePath: process.env.ROBOSWARM__BASE_PATH ? process.env.ROBOSWARM__BASE_PATH : "/root/"
    };
    const renderedTemplate = vmConfigTemplateCompiler(renderContext);
    console.log(renderedTemplate);
    return renderedTemplate;
}
