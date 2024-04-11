import { SimpleTxtLogger } from 'simple-txt-logger';
import rollbar from 'rollbar';


export class Rollbar {

    private rollbar: rollbar;
    private txtLogger: SimpleTxtLogger | undefined;

    public constructor(accessToken: string, environment: string, txtLogger?: SimpleTxtLogger) {
        if (txtLogger) this.txtLogger = txtLogger;

        this.rollbar = new rollbar({
            accessToken: accessToken,
            captureUncaught: true,
            captureUnhandledRejections: true,
            environment: environment
        });

        this.rollbarInfo(`Rollbar Successfully Configured with an application.`);
        if (this.txtLogger) this.txtLogger.writeToLogFile('Initialized Logging: Rollbar Setup.');
    }

    public rollbarInfo(info:Error | string): void {
        this.rollbar.info(info);
        if (this.txtLogger) this.txtLogger.writeToLogFile('Reported Information to Rollbar.');
    }

    public rollbarLog(log:Error | string): void {
        this.rollbar.log(log);
        if (this.txtLogger) this.txtLogger.writeToLogFile('Reported a Log to Rollbar.');
    }

    public rollbarDebug(bug:Error | string): void {
        this.rollbar.debug(bug);
        if (this.txtLogger) this.txtLogger.writeToLogFile('Reported a Bug to Rollbar.');
    }

    public rollbarWarn(warning:Error | string): void {
        this.rollbar.warning(warning);
        if (this.txtLogger) this.txtLogger.writeToLogFile('Reported a Warning to Rollbar.');
    }

    public rollbarError(error:Error | string): void {
        this.rollbar.error(error);
        if (this.txtLogger) this.txtLogger.writeToLogFile('Reported an Error to Rollbar.');
    }

    public rollbarCritical(critError:Error | string): void {
        this.rollbar.critical(critError);
        if (this.txtLogger) this.txtLogger.writeToLogFile('Reported a Critical Error to Rollbar.');
    }
}
