import * as os from 'os';
import { SfdxCommand } from '@salesforce/command';
import { Messages } from '@salesforce/core';
import { AnyJson } from '@salesforce/ts-types';
import { startInit } from '../../../utils/dirManagment';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@cgi-fr/salesforce-toolbox', 'initConfig');

export default class InitConfig extends SfdxCommand {
    public static description = messages.getMessage('commandDescription');

    public static examples = messages.getMessage('examples').split(os.EOL);
    protected static requiresUsername = false;
    protected static supportsDevhubUsername = false;
    protected static requiresProject = true;

    public async run(): Promise<AnyJson> {
        this.ux.styledHeader('Generating Config File');
        const configFilePath: string = await startInit(this.project['path']);
        this.ux.log(`Config File created here : ${configFilePath}`);
        this.ux.log('Edit it before launching profile update job !');

        return { path: configFilePath };
    }
}
