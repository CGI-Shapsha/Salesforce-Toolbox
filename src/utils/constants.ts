const workingDirName = 'CGIToolBoxWD';
const profileConfigFileName = 'profileUpdateConfig.json';
const translationConfigFileName = 'translationUpdateConfig.json';
const manifestFileName = 'manifest.xml';
const tempProjectDirName = 'temp-app';
const manifestJSONBase = {
    Package: {
        $: {
            xmlns: 'http://soap.sforce.com/2006/04/metadata',
        },
        types: [],
        version: '',
    },
};
const exampleProfileConfig = {
    sObjects: [
        {
            apiName: 'StandardsObject1',
            retrieveObjectPermissions: false,
            retrieveRecordTypeVisibilities: true,
            retrieveLayoutAssignments: true,
            fields: {
                permissionsFor: ['standardFieldA', 'customFieldB__c']
            }
        },
        {
            apiName: 'CustomsObject2__c',
            retrieveObjectPermissions: true,
            retrieveRecordTypeVisibilities: false,
            retrieveLayoutAssignments: false,
            fields: {
                allPermissions: true
            }
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
        permissionsFor: ['userPerm_1','userPerm_2']
    },
    externalDataSource: {
        allPermissions: false,
        permissionsFor: ['ext_source_1','ext_source_2']
    },
	loginIpRanges: true,
	loginHours: true
};
const exampleTranslationConfig = {
    sObjects: [
        {
            apiName: 'sObject1',
            fields: {
				allTranslations: true
			}
        },
        {
            apiName: 'sObject2',
            retrieveObjectRenameTranslations: false,
            fields: {
				allTranslations: false,
            	translationsFor: ['standardFieldA', 'customFieldB__c']
			},
			layouts: {
				allTranslations: false,
            	translationsFor: ['layout1', 'layout2']
			},
            fieldSets: {
				allTranslations: false,
            	translationsFor: ['fieldSet1', 'fieldSet2']
			},
            quickActions: {
				allTranslations: false,
            	translationsFor: ['quickAction1', 'quickAction2']
			},
            recordTypes: {
				allTranslations: false,
            	translationsFor: ['record_type_1', 'record_type_2']
			},
            sharingReasons: {
				allTranslations: false,
            	translationsFor: ['sharingReason1', 'sharingReason2']
			},
            validationRules: {
				allTranslations: false,
            	translationsFor: ['vr01', 'vr02']
			},
            webLinks: {
				allTranslations: false,
            	translationsFor: ['button1', 'link2']
			}
        }
    ],
    customApplications: {
        allTranslations: false,
        translationsFor: ['customApp1', 'customApp2']
    },
    customLabels: {
        allTranslations: false,
        translationsFor: ['customLabel1', 'customLabel2']
    },
    flows: {
        allTranslations: false,
        translationsFor: ['flow1', 'flow2']
    },
    globalQuickActions: {
        allTranslations: false,
        translationsFor: ['globalQuickActions1', 'globalQuickActions2']
    },
    reportTypes: {
        allTranslations: false,
        translationsFor: ['reportTypes1', 'reportTypes2']
    }
};

export { 
    workingDirName,
    profileConfigFileName,
    translationConfigFileName,
    exampleProfileConfig,
    exampleTranslationConfig,
    manifestFileName,
    manifestJSONBase,
    tempProjectDirName
};
