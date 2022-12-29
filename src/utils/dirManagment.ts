import * as fs from 'fs';
import * as path from 'path';
import { workingDirName, configFileName, exampleConfig } from './constants';

const checkWorkingDir = async function (projectPath: string): Promise<string> {
    const workingDirPath = path.join(projectPath, workingDirName);
    if (!fs.existsSync(workingDirPath)) {
        await fs.promises.mkdir(workingDirPath);
    }
    return workingDirPath;
};

/**
 * Creates Directories and config file
 *
 * @param projectPath path to the sfdx project root dir
 */
const startInit = async function (projectPath: string): Promise<string> {
    const workingDirPath = await checkWorkingDir(projectPath);

    const configFilePath: fs.PathLike = path.join(workingDirPath, configFileName);
    await fs.promises.writeFile(configFilePath, JSON.stringify(exampleConfig, null, '\t'));

    return configFilePath;
};

/**
 * Deletes a directory and all its content (sub-directories and files)
 *
 * @param dirPath path to the directory to delete
 */
const deleteDirRecursive = async function (dirPath: string): Promise<void> {
    await fs.promises.rm(dirPath, { recursive: true, force: true });
};

export { checkWorkingDir, startInit, deleteDirRecursive };
