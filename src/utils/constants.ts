const workingDirName = 'CGIToolBoxWD';
const configFileName = 'profileUpdateConfig.json';
const exampleConfig = {
    sObjects: [
        {
            apiName: 'StandardsObject1',
            retrieveObjectPermissions: false,
            fields: ['standardFieldA', 'customFieldB__c'],
        },
        {
            apiName: 'CustomsObject2__c',
            retrieveObjectPermissions: true,
            allFields: true,
        },
    ],
};
const manifestFileName = 'manifest.xml';
const tempProjectDirName = 'temp-app';

export { workingDirName, configFileName, exampleConfig, manifestFileName, tempProjectDirName };
