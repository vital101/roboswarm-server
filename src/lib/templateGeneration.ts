import * as swig from "swig";
import * as shell from "shelljs";
import { writeFileSync } from "fs";
import { v1 as generateUUID } from "uuid";
import * as LoadTestTemplate from "../models/LoadTestTemplate";

swig.setFilter("increment", input => {
    return input + 1;
});

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
    const appRoot = process.env.APP_ROOT ? "" : process.env.APP_ROOT;
    const templatePath = `swig-templates/locustfile.template.py`;
    const compiledTemplate = swig.renderFile(templatePath, renderContext);
    return compiledTemplate;
}

async function generateRequirementsFile(): Promise<string> {
    const templatePath = `swig-templates/requirements.template.txt`;
    const compiledTemplate = swig.renderFile(templatePath);
    return compiledTemplate;
}

export async function generateLocustFileZip(templateId: number): Promise<string> {
    const compiledTemplate = await generateLocustFile(templateId);
    const compiledRequirements = await generateRequirementsFile();
    const directoryUUID = generateUUID();
    const directory = `/tmp/roboswarm-${directoryUUID}`;
    shell.mkdir(directory);
    writeFileSync(`${directory}/locustfile.py`, compiledTemplate);
    writeFileSync(`${directory}/requirements.txt`, compiledRequirements);
    shell.cd(directory);
    shell.exec(`zip -9 -j -r load-test.zip ${directory}/`, { silent: true });
    const zipFilePath = `${directory}/load-test.zip`;
    const zipFileDir = `${generateUUID()}`;
    const zipFileNewPathName = `${generateUUID()}.zip`;
    const saveFilePath = process.env.FILE_UPLOAD_PATH || "uploads/";
    shell.exec(`mkdir -p ${saveFilePath}${zipFileDir}`);
    shell.exec(`mv ${zipFilePath} ${saveFilePath}${zipFileDir}/${zipFileNewPathName}`);
    return `${saveFilePath}${zipFileDir}/${zipFileNewPathName}`;
}