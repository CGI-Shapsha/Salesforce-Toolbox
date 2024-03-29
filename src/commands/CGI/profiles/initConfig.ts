import * as os from 'os';
import { SfCommand } from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';
import { startProfileInit } from '../../../utils/dirManagment';
import { InitConfigOutput } from '../../../utils/typeDefs';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@cgi-fr/salesforce-toolbox', 'initConfigProfiles');

export default class InitConfig extends SfCommand<InitConfigOutput> {
    public static description = messages.getMessage('commandDescription');

    public static examples = messages.getMessage('examples').split(os.EOL);
    public static requiresUsername = false;
    public static supportsDevhubUsername = false;
    public static requiresProject = true;

    public async run(): Promise<InitConfigOutput> {
        this.styledHeader('Generating Config File for Profiles Update job');
        const configFilePath: string = await startProfileInit(this.project.getPath());
        this.log(`Config File created here : ${configFilePath}`);
        this.log('Edit it before launching profile update job !!\n');

        return { path: configFilePath };
    }
}
