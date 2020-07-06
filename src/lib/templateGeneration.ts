import * as swig from "swig";
import * as shell from "shelljs";
import { writeFileSync } from "fs";
import { v1 as generateUUID } from "uuid";
import { asyncReadFile } from "../lib/lib";
import * as LoadTestTemplate from "../models/LoadTestTemplate";
import * as LoadTestFile from "../models/LoadTestFile";

swig.setFilter("increment", input => {
    return input + 1;
});

const appRoot = process.env.NODE_ENV === "production"
    ? "/var/www/roboswarm/current"
    : "/Users/jack/repos/roboswarm";

interface SwigTemplateContext {
    username: string;
    password: string;
    authenticated_backend: LoadTestTemplate.TemplateRoute[];
    authenticated_frontend: LoadTestTemplate.TemplateRoute[];
    unauthenticated_frontend: LoadTestTemplate.TemplateRoute[];
}

export async function generateLocustFile(templateId: number): Promise<string> {
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
                id: idx + 1
            };
        });
    }

    const hasAuthenticatedFrontend = routes.find(f => f.routeType === LoadTestTemplate.WordPressRouteType.AUTHENTICATED_FRONTEND_NAVIGATE);
    if (hasAuthenticatedFrontend) {
        renderContext.authenticated_frontend = hasAuthenticatedFrontend.routes.map((r, idx) => {
            return {
                ...r,
                id: idx + 1
            };
        });
    }

    const hasUnauthenticatedFrontend = routes.find(f => f.routeType === LoadTestTemplate.WordPressRouteType.UNAUTHENTICATED_FRONTEND_NAVIGATE);
    if (hasUnauthenticatedFrontend) {
        renderContext.unauthenticated_frontend = hasUnauthenticatedFrontend.routes.map((r, idx) => {
            return {
                ...r,
                id: idx + 1
            };
        });
    }
    const templatePath = `${appRoot}/swig-templates/locustfile.template.py`;
    const compiledTemplate = swig.renderFile(templatePath, renderContext);
    return compiledTemplate;
}

async function generateRequirementsFile(): Promise<string> {
    const templatePath = `${appRoot}/swig-templates/requirements.template.txt`;
    const compiledTemplate = swig.renderFile(templatePath);
    return compiledTemplate;
}

export async function generateLocustFileZip(templateId: number): Promise<string> {
    const compiledTemplate = await generateLocustFile(templateId);
    const compiledRequirements = await generateRequirementsFile();
    const directoryUUID = generateUUID();
    const directory = `/tmp/roboswarm-${directoryUUID}`;
    shell.exec(`mkdir -p ${directory}`);
    writeFileSync(`${directory}/locustfile.py`, compiledTemplate);
    writeFileSync(`${directory}/requirements.txt`, compiledRequirements);
    shell.cd(directory);
    shell.exec(`zip -9 -j -r load-test.zip ${directory}/`, { silent: true });
    const zipFilePath = `${directory}/load-test.zip`;
    const zipFileDir = `${generateUUID()}`;
    const zipFileNewPathName = `${generateUUID()}.zip`;
    const saveFilePath = "/tmp/";
    console.log(1);
    shell.exec(`mkdir -p ${saveFilePath}${zipFileDir}`);
    console.log(2);
    shell.exec(`mv ${zipFilePath} ${saveFilePath}${zipFileDir}/${zipFileNewPathName}`);
    console.log(3);
    shell.exec(`rf -rf ${directory}`);
    console.log(`Returning: ${saveFilePath}${zipFileDir}/${zipFileNewPathName}`);
    return `${saveFilePath}${zipFileDir}/${zipFileNewPathName}`;
}

export async function generateAndSaveTemplate(swarm_id: number, template_id: number): Promise<number> {
    const zipFilePath = await generateLocustFileZip(template_id);
    const fileBuffer = await asyncReadFile(zipFilePath);
    const ltFile: LoadTestFile.LoadTestFile = await LoadTestFile.create({
        swarm_id,
        lt_file: fileBuffer
    });
    shell.exec(`rm ${zipFilePath}`);
    return ltFile.id;
}