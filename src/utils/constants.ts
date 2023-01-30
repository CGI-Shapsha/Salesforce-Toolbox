const workingDirName = 'CGIToolBoxWD';
const configFileName = 'profileUpdateConfig.json';
const exampleConfig = {
    sObjects: [
        {
            apiName: 'StandardsObject1',
            retrieveObjectPermissions: false,
            retrieveRecordTypeVisibilities: true,
            retrievelayoutAssignments: true,
            fieldsPermissionsFor: ['standardFieldA', 'customFieldB__c'],
        },
        {
            apiName: 'CustomsObject2__c',
            retrieveObjectPermissions: true,
            retrieveRecordTypeVisibilities: false,
            retrievelayoutAssignments: false,
            allFieldsPermissions: true
        },
    ],
    apexClasses: {
		allPermissions: false,
		permissionsFor: ['AP01_MyApexClass','AP02_MyOtherApexClass']
	},
    apexPages: {
		allPermissions: false,
		permissionsFor: ['VFP01_My_Visualforce_Page','VFP02_TheOtherOne']
	},
    customApplications: {
        allPermissions: false,
        permissionsFor: ['App1','App2']
    },
    customMetadataTypes: {
        allPermissions: false,
        permissionsFor: ['cmt1__mdt','cmt2__mdt']
    },
    customPermissions: {
        allPermissions: false,
        permissionsFor: ['custo_perm_1','custo_perm_2']
    },
    customSettings: {
        allPermissions: false,
        permissionsFor: ['custo_set_1','custo_set_2']
    },
    customTabs: {
        allPermissions: false,
        permissionsFor: ['custo_tab_1','custo_tab_2']
    },
    userPermissions: {
        allPermissions: false,
        permissionsFor: ['custo_tab_1','custo_tab_2']
    },
    externalDataSource: {
        allPermissions: false,
        permissionsFor: ['ext_source_1','ext_source_2']
    },
	loginIpRanges: true,
	loginHours: true
};
const manifestFileName = 'manifest.xml';
const tempProjectDirName = 'temp-app';

export { workingDirName, configFileName, exampleConfig, manifestFileName, tempProjectDirName };
