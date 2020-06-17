import * as swig from "swig";
import * as shell from "shelljs";
import { writeFileSync } from "fs";
import { v1 as generateUUID } from "uuid";
import * as LoadTestTemplateRoute from "../models/LoadTestTemplateRoute";

async function generateLocustFile(templateId: number): Promise<string> {
    const routes: LoadTestTemplateRoute.LoadTestTemplateRoute[] = await LoadTestTemplateRoute.getByTemplateId(templateId);
    const templatePath = `${process.env.APP_ROOT}/swig-templates/locustfile.template.py`;
    const compiledTemplate = swig.renderFile(templatePath, { routes });
    return compiledTemplate;
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