/**
 * @description Utility methods to manage file system
 * @author Philippe Planchon <planchon.phil@gmail.com>
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  workingDirName,
  profileConfigFileName,
  translationConfigFileName,
  exampleProfileConfig,
  exampleTranslationConfig,
} from './constants.js';

const checkWorkingDir = async function (projectPath: string): Promise<string> {
  const workingDirPath = path.join(projectPath, workingDirName);
  if (!fs.existsSync(workingDirPath)) {
    await fs.promises.mkdir(workingDirPath);
  }
  return workingDirPath;
};

/**
 * Creates Directories and config file for profile update job
 *
 * @param projectPath path to the sfdx project root dir
 */
const startProfileInit = async function (projectPath?: string): Promise<string> {
  if (!projectPath) {
    throw new Error('error in startProfileInit : projectPath is mandatory');
  }
  const workingDirPath = await checkWorkingDir(projectPath);

  const configFilePath: fs.PathLike = path.join(workingDirPath, profileConfigFileName);
  await fs.promises.writeFile(configFilePath, JSON.stringify(exampleProfileConfig, null, '\t'));

  return configFilePath;
};

/**
 * Creates Directories and config file for translation update job
 *
 * @param projectPath path to the sfdx project root dir
 */
const startTranslationInit = async function (projectPath?: string): Promise<string> {
  if (!projectPath) {
    throw new Error('error in startProfileInit : projectPath is mandatory');
  }
  const workingDirPath = await checkWorkingDir(projectPath);

  const configFilePath: fs.PathLike = path.join(workingDirPath, translationConfigFileName);
  await fs.promises.writeFile(configFilePath, JSON.stringify(exampleTranslationConfig, null, '\t'));

  return configFilePath;
};

/**
 * Deletes a directory and all its content (sub-directories and files)
 *
 * @param dirPath path to the directory to delete
 */
const deleteDirRecursive = async function (dirPath: string): Promise<void> {
  try {
    await fs.promises.rm(dirPath, { recursive: true, force: true });
  } catch {
    // try another time if it failed the first time
    await fs.promises.rm(dirPath, { recursive: true, force: true });
  }
};

/**
 * Deletes a file if it exists
 *
 * @param filePath path to the file to delete
 */
const deleteFile = async function (filePath: string | undefined): Promise<void> {
  if (!filePath) return;
  if (fs.existsSync(filePath) && fs.lstatSync(filePath).isFile()) {
    await fs.promises.rm(filePath, { force: true });
  }
};

/**
 * Deletes a file if it exists
 *
 * @param dirPath path to the directory containing the files to delete
 * @param fileList file names list
 */
const deleteFiles = async function (dirPath: string, fileList: string[]): Promise<void> {
  await Promise.all(fileList.map((file) => fs.promises.unlink(path.join(dirPath, file))));
};

/**
 * Copy a file
 *
 * @param sourcePath path to the source file
 * @param destinationPath destination file path
 */
const copyFile = async function (sourcePath?: string, destinationPath?: string): Promise<void> {
  if (!sourcePath || !destinationPath) {
    return;
  }
  const destDirName = path.dirname(destinationPath);
  if (!fs.existsSync(destDirName)) {
    await fs.promises.mkdir(destDirName, { recursive: true });
  }
  await fs.promises.copyFile(sourcePath, destinationPath);
};

/**
 * Copy files if it exists
 *
 * @param sourceDirPath path to the directory where files to copy are
 * @param destDirPath path to the directory where files will be copied
 * @param fileList file names list
 */
const copyFiles = async function (sourceDirPath: string, destDirPath: string, fileList: string[]): Promise<void> {
  if (!fs.existsSync(destDirPath)) {
    await fs.promises.mkdir(destDirPath, { recursive: true });
  }
  await Promise.all(
    fileList.map((file) => fs.promises.copyFile(path.join(sourceDirPath, file), path.join(destDirPath, file)))
  );
};

/**
 * Copy a directory and its all its content
 *
 * @param sourcePath path to the source dir
 * @param destinationPath destination path
 */
const copyDir = async function (sourcePath: string, destinationPath: string): Promise<void> {
  await fs.promises.cp(sourcePath, destinationPath, { recursive: true });
};

/**
 * Copy a directory and its all its content
 *
 * @param sourcePath path to the source dir
 * @param destinationPath destination path
 */
const getAllFilesByEnding = async function (dirPath: string, ending: string): Promise<string[]> {
  const matchedFiles: string[] = [];

  const files = await fs.promises.readdir(dirPath);

  for (const file of files) {
    // Method 3:
    if (file.includes(ending)) {
      matchedFiles.push(file);
    }
  }

  return matchedFiles;
};

export {
  checkWorkingDir,
  startProfileInit,
  startTranslationInit,
  deleteDirRecursive,
  deleteFile,
  deleteFiles,
  copyFile,
  copyFiles,
  copyDir,
  getAllFilesByEnding,
};
