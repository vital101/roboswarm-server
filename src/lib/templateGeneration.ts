import * as swig from "swig";
import * as shell from "shelljs";
import { writeFileSync } from "fs";
import { v1 as generateUUID, v1 } from "uuid";
import * as LoadTestTemplate from "../models/LoadTestTemplate";

interface SwigTemplateContext {
    username: string;
    password: string;
    authenticated_backend: LoadTestTemplate.TemplateRoute;
    authenticated_frontend: LoadTestTemplate.TemplateRoute;
    unauthenticated_frontend: LoadTestTemplate.TemplateRoute;
}

async function generateLocustFile(templateId: number): Promise<string> {
    const template = await LoadTestTemplate.getById(templateId);
    const renderContext: SwigTemplateContext = {
        username: template.username,
        password: template.password,
        authenticated_backend: undefined,
        authenticated_frontend: undefined,
        unauthenticated_frontend: undefined
    };
    const routes = template.routes as LoadTestTemplate.WordPressRoute[];
    // routes.map(r => {
    //     return {
    //         ...r,
    //         id: v1(),
    //         routeType: getRouteTypeString(r.routeType)
    //     };
    // });
    // delete template.routes;
    const templatePath = `${process.env.APP_ROOT}/swig-templates/locustfile.template.py`;
    /*
    WIP - Need to pass an object into the template that looks like:

    {
        username: false || string
        password: false || string
        authenticated_backend: false || [{ method, path }]
        authenticated_frontend: false || [{ method, path }]
        unauthenticated_fronted: false || [{ method, path }]
    }
    */
    const compiledTemplate = swig.renderFile(templatePath, renderContext);
    return compiledTemplate;
}

function getRouteTypeString(routeType: LoadTestTemplate.WordPressRouteType) {
    switch (routeType) {
        case LoadTestTemplate.WordPressRouteType.AUTHENTICATED_ADMIN_NAVIGATE:
            return "AUTHENTICATED_ADMIN_NAVIGATE";
        case LoadTestTemplate.WordPressRouteType.AUTHENTICATED_FRONTEND_NAVIGATE:
            return "AUTHENTICATED_FRONTEND_NAVIGATE";
        case LoadTestTemplate.WordPressRouteType.UNAUTHENTICATED_FRONTEND_NAVIGATE:
            return "UNAUTHENTICATED_FRONTEND_NAVIGATE";
    }
}

async function generateRequirementsFile(): Promise<string> {
    const templatePath = `${process.env.APP_ROOT}/swig-templates/requirements.template.txt`;
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