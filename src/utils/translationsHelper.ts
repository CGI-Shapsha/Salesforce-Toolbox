/* eslint-disable no-await-in-loop */
import * as path from 'path';
import * as fs from 'fs';
import { registry, SourceComponent } from '@salesforce/source-deploy-retrieve';
import * as utils from './utils';
import { GenericTransConfigType, ParsedCustomObjectTranslation, ParsedTranslation, TranslationConfigType, UpdaterOptionsType } from './typeDefs';
import { tempProjectDirName, workingDirName } from './constants';
import { copyFile, copyFiles, deleteDirRecursive, deleteFile, deleteFiles, getAllFilesByEnding } from './dirManagment';



const objTransJSON: Record<string, ParsedCustomObjectTranslation> = {};
const transJSON: Record<string, ParsedTranslation> = {};
const objTransJSONModified: Set<string> = new Set<string>();
const transJSONModified: Set<string> = new Set<string>();

const updateFieldTranslations = async function (
    options: UpdaterOptionsType,
    config: TranslationConfigType,
    retrievedObjectTranslations: SourceComponent[],
    activatedLanguages: string[]
): Promise<void> {
    const projectPath = options.projectPath;
    const projectPackDir = options.projectPackDir;
    const defaultPackDir = projectPackDir.find(packDir => packDir.default);
    const defaultProjectSourcePath = path.join(defaultPackDir.fullPath, 'main', 'default');

    for (const sObjConf of config.sObjects) {
        if(sObjConf.fields?.allTranslations
        || (sObjConf.fields?.translationsFor && sObjConf.fields.translationsFor.length > 0)) {
            for (const lang of activatedLanguages) {
                // Get all retreived translations for this sObject and language
                const retrievedsObjTrans = retrievedObjectTranslations.find(trans => trans.fullName === `${sObjConf.apiName}-${lang}`);
                const destDir = path.join(
                    defaultProjectSourcePath,
                    registry.types.customobjecttranslation.directoryName,
                    `${sObjConf.apiName}-${lang}`
                );
                if(retrievedsObjTrans) {
                    // Get all Field Translations for this sObject and language
                    const retrievedFieldTrans = retrievedsObjTrans.getChildren();
                    const fieldTranslationEnding = `.${registry.types.customobjecttranslation.children.types.customfieldtranslation.suffix}-meta.xml`;

                    if (sObjConf.fields.allTranslations) {
                        // deleting existing translations
                        let translationList = await getAllFilesByEnding(
                            destDir,
                            fieldTranslationEnding
                        );
                        try {
                            await deleteFiles(destDir, translationList);
                        } catch {
                            // try another time if it failed the first time
                            await deleteFiles(destDir, translationList);
                        }
                        
                        // Build the source path
                        const sourceDir = path.join(
                            projectPath,
                            workingDirName,
                            tempProjectDirName,
                            'main', 'default',
                            registry.types.customobjecttranslation.directoryName,
                            `${sObjConf.apiName}-${lang}`
                        );

                        // copying fresh translations
                        translationList = await getAllFilesByEnding(
                            sourceDir,
                            fieldTranslationEnding
                        );
                        try {
                            await copyFiles(sourceDir, destDir, translationList);
                        } catch {
                            // try another time if it failed the first time
                            await copyFiles(sourceDir, destDir, translationList);
                        }
                    }
                    else { // sObjConf.fieldsTranslationsFor && sObjConf.fieldsTranslationsFor.length > 0
                        for (const fieldAPIName of sObjConf.fields.translationsFor) {
                            const retrievedTrans = retrievedFieldTrans.find(rft => rft.name === fieldAPIName);
                            // Build the destination path
                            const destPath = path.join(
                                destDir,
                                `${fieldAPIName}${fieldTranslationEnding}`
                            );

                            if(retrievedTrans) {
                                await copyFile(retrievedTrans.xml, destPath);
                            } else {
                                await deleteFile(destPath);
                            }
                        }
                    }
                } else {
                    // sObject does not exist anymore, so delete its translations
                    await deleteDirRecursive(destDir);
                }
            }
        }
    }
    return;
}

// eslint-disable-next-line complexity
const updateObjectTranslationsFile = async function (
    options: UpdaterOptionsType,
    config: TranslationConfigType,
    localObjectTranslations: SourceComponent[],
    retrievedObjectTranslations: SourceComponent[],
    activatedLanguages: string[]
): Promise<void> {
    // const projectPath = options.projectPath;
    const projectPackDir = options.projectPackDir;
    const defaultPackDir = projectPackDir.find(packDir => packDir.default);
    const defaultProjectPath = path.join(defaultPackDir.fullPath, 'main', 'default');

    for (const sObjConf of config.sObjects) {
        if (sObjConf.retrieveObjectRenameTranslations) {
            await updateGenericObjectTranslations(
                {allTranslations: true},
                sObjConf.apiName,
                'caseValues',
                undefined,
                localObjectTranslations,
                retrievedObjectTranslations,
                activatedLanguages,
                defaultProjectPath
            );
        }
        if (sObjConf.layouts?.allTranslations
            || (sObjConf.layouts?.translationsFor && sObjConf.layouts.translationsFor.length > 0)) {
            await updateGenericObjectTranslations(
                sObjConf.layouts,
                sObjConf.apiName,
                'layouts',
                'layout',
                localObjectTranslations,
                retrievedObjectTranslations,
                activatedLanguages,
                defaultProjectPath
            );
        }
        if (sObjConf.fieldSets?.allTranslations
            || (sObjConf.fieldSets?.translationsFor && sObjConf.fieldSets.translationsFor.length > 0)) {
            await updateGenericObjectTranslations(
                sObjConf.fieldSets,
                sObjConf.apiName,
                'fieldSets',
                'name',
                localObjectTranslations,
                retrievedObjectTranslations,
                activatedLanguages,
                defaultProjectPath
            );
        }
        if (sObjConf.quickActions?.allTranslations
            || (sObjConf.quickActions?.translationsFor && sObjConf.quickActions.translationsFor.length > 0)) {
            await updateGenericObjectTranslations(
                sObjConf.quickActions,
                sObjConf.apiName,
                'quickActions',
                'name',
                localObjectTranslations,
                retrievedObjectTranslations,
                activatedLanguages,
                defaultProjectPath
            );
        }
        if (sObjConf.recordTypes?.allTranslations
            || (sObjConf.recordTypes?.translationsFor && sObjConf.recordTypes.translationsFor.length > 0)) {
            await updateGenericObjectTranslations(
                sObjConf.recordTypes,
                sObjConf.apiName,
                'recordTypes',
                'name',
                localObjectTranslations,
                retrievedObjectTranslations,
                activatedLanguages,
                defaultProjectPath
            );
        }
        if (sObjConf.sharingReasons?.allTranslations
            || (sObjConf.sharingReasons?.translationsFor && sObjConf.sharingReasons.translationsFor.length > 0)) {
            await updateGenericObjectTranslations(
                sObjConf.sharingReasons,
                sObjConf.apiName,
                'sharingReasons',
                'name',
                localObjectTranslations,
                retrievedObjectTranslations,
                activatedLanguages,
                defaultProjectPath
            );
        }
        if (sObjConf.validationRules?.allTranslations
            || (sObjConf.validationRules?.translationsFor && sObjConf.validationRules.translationsFor.length > 0)) {
            await updateGenericObjectTranslations(
                sObjConf.validationRules,
                sObjConf.apiName,
                'validationRules',
                'name',
                localObjectTranslations,
                retrievedObjectTranslations,
                activatedLanguages,
                defaultProjectPath
            );
        }
        if (sObjConf.webLinks?.allTranslations
            || (sObjConf.webLinks?.translationsFor && sObjConf.webLinks.translationsFor.length > 0)) {
            await updateGenericObjectTranslations(
                sObjConf.webLinks,
                sObjConf.apiName,
                'webLinks',
                'name',
                localObjectTranslations,
                retrievedObjectTranslations,
                activatedLanguages,
                defaultProjectPath
            );
        }
        if (sObjConf.workflowTasks?.allTranslations
            || (sObjConf.workflowTasks?.translationsFor && sObjConf.workflowTasks.translationsFor.length > 0)) {
            await updateGenericObjectTranslations(
                sObjConf.workflowTasks,
                sObjConf.apiName,
                'workflowTasks',
                'name',
                localObjectTranslations,
                retrievedObjectTranslations,
                activatedLanguages,
                defaultProjectPath
            );
        }
    }
    for (const filePath of objTransJSONModified) {
        const localsObjTransJSON = objTransJSON[filePath];
        localsObjTransJSON.CustomObjectTranslation = utils.sortObjTranslation(localsObjTransJSON.CustomObjectTranslation);
        await utils.writeXml(filePath, localsObjTransJSON);
    }
    return;
}

const updateGenericObjectTranslations = async function (
    genericConfig: GenericTransConfigType,
    sObjAPIName: string,
    translationType: string,
    translationTypeKey: string,
    localObjectTranslations: SourceComponent[],
    retrievedObjectTranslations: SourceComponent[],
    activatedLanguages: string[],
    defaultProjectPath: string
): Promise<void> {
    /* eslint-disable @typescript-eslint/no-unsafe-assignment */
    /* eslint-disable @typescript-eslint/no-unsafe-member-access */
    /* eslint-disable @typescript-eslint/no-unsafe-call */
    if(genericConfig.allTranslations) {
        for (const lang of activatedLanguages) {
            // Get all retreived translations for this sObject and language
            const retrievedsObjTrans = retrievedObjectTranslations.find(trans => trans.fullName === `${sObjAPIName}-${lang}`);
            const destDir = path.join(
                defaultProjectPath,
                registry.types.customobjecttranslation.directoryName,
                `${sObjAPIName}-${lang}`
            );
            if(retrievedsObjTrans) {
                // Get translation files Path
                const retrievedObjectTransFilePath = retrievedsObjTrans.xml;
                const localObjectTransFilePath = path.join(
                    destDir,
                    `${sObjAPIName}-${lang}.${registry.types.customobjecttranslation.suffix}-meta.xml`
                );
                
                if (!fs.existsSync(localObjectTransFilePath)) {
                    // No actual translation for this sObjet, so copy the retrieved one
                    await copyFile(retrievedObjectTransFilePath, localObjectTransFilePath);
                } else {
                    const retrievedObjectTranslation = await getOjectTranslationJSON(retrievedObjectTransFilePath);
                    const localObjectTranslation = await getOjectTranslationJSON(localObjectTransFilePath);
                    localObjectTranslation.CustomObjectTranslation[translationType] = retrievedObjectTranslation.CustomObjectTranslation[translationType];
                    objTransJSONModified.add(localObjectTransFilePath);
                }
            } else {
                // sObject does not exist anymore, so delete its translations
                await deleteDirRecursive(destDir);
            }
        }
    } else if (genericConfig.translationsFor && genericConfig.translationsFor.length > 0) {
        for (const lang of activatedLanguages) {
            // Get all retreived translations for this sObject and language
            const localsObjTransSC = localObjectTranslations.find(trans => trans.fullName === `${sObjAPIName}-${lang}`);
            const retrievedsObjTransSC = retrievedObjectTranslations.find(trans => trans.fullName === `${sObjAPIName}-${lang}`);

            const isExistingTrans = !!localsObjTransSC && fs.existsSync(localsObjTransSC.xml);
            const isRetrievedTrans = !!retrievedsObjTransSC && fs.existsSync(retrievedsObjTransSC.xml);

            const destDir = path.join(
                defaultProjectPath,
                registry.types.customobjecttranslation.directoryName,
                `${sObjAPIName}-${lang}`
            );

            if (!isExistingTrans && !isRetrievedTrans) {
                // No existing nor retrieved translation for this sObject & language
                continue;
            }
            else if (!isExistingTrans && isRetrievedTrans) {
                // No existing translation : copying whole retrieved one
                const destTransPath = path.join(
                    destDir,
                    `${sObjAPIName}-${lang}.${registry.types.customobjecttranslation.suffix}-meta.xml`
                );
                await copyFile(retrievedsObjTransSC.xml, destTransPath);
            }
            else if (isExistingTrans && !isRetrievedTrans) {
                // Existing translation found but no retrieved one : deleting local one
                await deleteDirRecursive(destDir);
            } else {
                // Existing & retrieved translations exist : updating local one
                const localsObjTransJSON = await getOjectTranslationJSON(localsObjTransSC.xml);
                const retrievedsObjTransJSON = await getOjectTranslationJSON(retrievedsObjTransSC.xml);

                let allLocalGenericTrans = localsObjTransJSON?.CustomObjectTranslation?.[translationType];
                const allRetrievedGenericTrans = retrievedsObjTransJSON?.CustomObjectTranslation?.[translationType];

                // remove existing translations
                allLocalGenericTrans =
                    allLocalGenericTrans?.filter(gt => !genericConfig.translationsFor.includes(gt[translationTypeKey][0])) ?? [];

                const retrievedGenericTrans = allRetrievedGenericTrans?.filter(gt => genericConfig.translationsFor.includes(gt[translationTypeKey][0]));
                allLocalGenericTrans.push(...retrievedGenericTrans);

                localsObjTransJSON.CustomObjectTranslation[translationType] = allLocalGenericTrans;

                objTransJSONModified.add(localsObjTransSC.xml);
            }
        }
    }

}

// eslint-disable-next-line complexity
const updateTranslations = async function (
    options: UpdaterOptionsType,
    config: TranslationConfigType,
    localTranslations: SourceComponent[],
    retrievedTranslations: SourceComponent[],
    activatedLanguages: string[]
): Promise<void> {
    
    const projectPackDir = options.projectPackDir;
    const defaultPackDir = projectPackDir.find(packDir => packDir.default);
    const defaultProjectPath = path.join(defaultPackDir.fullPath, 'main', 'default');
    const destDir = path.join(
        defaultProjectPath,
        registry.types.translations.directoryName
    );

    if (config.isCustomApplicationTranslations) {
        await updateGenericTranslations(
            config.customApplications,
            'customApplications',
            'name',
            localTranslations,
            retrievedTranslations,
            activatedLanguages,
            destDir
        );
    }

    if (config.isCustomLabelTranslations) {
        await updateGenericTranslations(
            config.customLabels,
            'customLabels',
            'name',
            localTranslations,
            retrievedTranslations,
            activatedLanguages,
            destDir
        );
    }

    if (config.isFlowTranslations) {
        await updateGenericTranslations(
            config.flows,
            'flowDefinitions',
            'fullName',
            localTranslations,
            retrievedTranslations,
            activatedLanguages,
            destDir
        );
    }

    if (config.isGlobalQuickActionTranslations) {
        await updateGenericTranslations(
            config.globalQuickActions,
            'quickActions',
            'name',
            localTranslations,
            retrievedTranslations,
            activatedLanguages,
            destDir
        );
    }

    if (config.isReportTypeTranslations) {
        await updateGenericTranslations(
            config.reportTypes,
            'reportTypes',
            'name',
            localTranslations,
            retrievedTranslations,
            activatedLanguages,
            destDir
        );
    }

    for (const filePath of transJSONModified) {
        const localTransJSON = transJSON[filePath];
        localTransJSON.Translations = utils.sortTranslation(localTransJSON.Translations);
        await utils.writeXml(filePath, localTransJSON);
    }
    return;
}

const updateGenericTranslations = async function (
    genericConfig: GenericTransConfigType,
    translationType: string,
    translationTypeKey: string,
    localTranslations: SourceComponent[],
    retrievedTranslations: SourceComponent[],
    activatedLanguages: string[],
    destDir: string
): Promise<void> {
    if(genericConfig.allTranslations) {
        for (const lang of activatedLanguages) {
            // Get all retreived translations for this language
            const retrievedTrans = retrievedTranslations.find(trans => trans.fullName === lang);
            const retrievedTransFilePath = retrievedTrans.xml;
            const fileName = path.basename(retrievedTransFilePath)
            const localTransFilePath = path.join(
                destDir,
                fileName
            );
            
            if(retrievedTrans) {
                // Get translation files Path
                if (!fs.existsSync(localTransFilePath)) {
                    // No local translation for this language, so copy the retrieved one
                    await copyFile(retrievedTransFilePath, localTransFilePath);
                } else {
                    const retrievedTranslation = await getTranslationJSON(retrievedTransFilePath);
                    const localTranslation = await getTranslationJSON(localTransFilePath);
                    localTranslation.Translations[translationType] = retrievedTranslation.Translations[translationType];
                    transJSONModified.add(localTransFilePath);
                }
            } else {
                // translation does not exist anymore, so delete its translations
                await deleteFile(localTransFilePath);
            }
        }
    }else if (genericConfig.translationsFor && genericConfig.translationsFor.length > 0) {
        for (const lang of activatedLanguages) {
            // Get all retreived translations for this language
            const localTransSC = localTranslations.find(trans => trans.fullName === lang);
            const retrievedTransSC = retrievedTranslations.find(trans => trans.fullName === lang);
            let localTransFilePath = localTransSC?.xml;
            const retrievedTransFilePath = retrievedTransSC?.xml;

            const isExistingTrans = !!localTransSC && fs.existsSync(localTransSC.xml);
            const isRetrievedTrans = !!retrievedTransSC && fs.existsSync(retrievedTransSC.xml);

            if (!isExistingTrans && !isRetrievedTrans) {
                // No existing nor retrieved translation for this sObject & language
                continue;
            }
            else if (!isExistingTrans && isRetrievedTrans) {
                // No existing translation : copying whole retrieved one
                const fileName = path.basename(retrievedTransFilePath)
                localTransFilePath = path.join(
                    destDir,
                    fileName
                );
                await copyFile(retrievedTransFilePath, localTransFilePath);
            }
            else if (isExistingTrans && !isRetrievedTrans) {
                // Existing translation found but no retrieved one : deleting local one
                await deleteFile(localTransFilePath);
            } else {
                // Existing & retrieved translations exist : updating local one
                const localTransJSON = await getTranslationJSON(localTransFilePath);
                const retrievedTransJSON = await getTranslationJSON(retrievedTransFilePath);

                let allLocalGenericTrans = localTransJSON?.Translations?.[translationType];
                const allRetrievedGenericTrans = retrievedTransJSON?.Translations?.[translationType];

                // remove existing translations
                allLocalGenericTrans =
                    allLocalGenericTrans?.filter(gt => !genericConfig.translationsFor.includes(gt[translationTypeKey][0])) ?? [];

                const retrievedGenericTrans = allRetrievedGenericTrans?.filter(gt => genericConfig.translationsFor.includes(gt[translationTypeKey][0]));
                if (retrievedGenericTrans) {
                    allLocalGenericTrans.push(...retrievedGenericTrans);
                }

                localTransJSON.Translations[translationType] = allLocalGenericTrans;

                transJSONModified.add(localTransSC.xml);
            }
        }
    }
    return;
}

const getOjectTranslationJSON = async function (
    filePath: string
): Promise<ParsedCustomObjectTranslation> {
    if (!objTransJSON || !objTransJSON[filePath]) {
        objTransJSON[filePath] = await utils.readXml(filePath) as ParsedCustomObjectTranslation;
    }
    return objTransJSON[filePath];
}

const getTranslationJSON = async function (
    filePath: string
): Promise<ParsedTranslation> {
    if (!transJSON || !transJSON[filePath]) {
        transJSON[filePath] = await utils.readXml(filePath) as ParsedTranslation;
    }
    return transJSON[filePath];
}

export {
    updateFieldTranslations,
    updateObjectTranslationsFile,
    updateTranslations
}