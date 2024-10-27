import { SimpleTxtLogger } from 'simple-txt-logger';
import { Transporter } from 'nodemailer';


export class AdminEmails {

    private txtLogger: SimpleTxtLogger | undefined;
    private transporter: Transporter;


    public constructor(transporter: Transporter, txtLogger?: SimpleTxtLogger) {
        if (this.txtLogger) this.txtLogger = txtLogger;
        this.transporter = transporter;
    }


    public async sendResetEmail(email: string, username: string, newRandomPassword: string): Promise<boolean> {
        let success: boolean = false;

        try {
            if (this.transporter) {
                try {
                    success = await new Promise<boolean>((resolve, reject) => {
                        this.transporter.sendMail({
                            from: process.env['EMAIL_ADDRESS'],
                            to: email,
                            subject: 'Mencap Website Account Recovery',
                            text: 'Hi,\n\n'
                                + 'You are receiving this email because you have forgotten your Mencap website login details.\n'
                                + 'Your password has been reset, and you can find both your Username and Password below:\n\n'
                                + `Your Username:  '${username}'\nYour new Password:  '${newRandomPassword}'.\n\n`
                                + 'You can login here: https://www.mencapliverpool.org.uk/login\n\n\n\n'
                                + `If you did not do this, or were not expecting this email, you can reply to this email or contact: ${process.env['EMAIL_ADDRESS']}\n`
                        }, (err, info) => {
                            if (err) {
                                if (this.txtLogger) this.txtLogger.writeToLogFile(`Error sending account recovery email: ${err}\n${info?.response}`);
                                reject(false);
                            } else {
                                if (this.txtLogger) this.txtLogger.writeToLogFile(`Account recovery email sent: ${info.response}`);
                                resolve(true);
                            }
                        });
                    });

                    return success;
                } catch (err) {
                    if (this.txtLogger) this.txtLogger.writeToLogFile(`Error sending admin email: ${err}`);
                    return false;
                }
            } else {
                return false;
            }
        } catch (err) {
            if (this.txtLogger) this.txtLogger.writeToLogFile(`Error sending admin email: ${err}`);
            return false;
        }
    }


    public async sendUpdateEmail(email: string, newEmail: string, newUsername: string, newPassword: string): Promise<boolean> {
        let success: boolean = false;
    
        try {
            if (this.transporter) {
                try {
                    success = await new Promise<boolean>((resolve, reject) => {
                        this.transporter.sendMail({
                            from: process.env['EMAIL_ADDRESS'],
                            to: email,
                            subject: 'Mencap Website Account Updated',
                            text:
                                'Hi,\n\n'
                                + 'You are receiving this email because you have updated your Mencap website account.\n'
                                + 'Your account has successfully been updated, and you can check which details were updated below:\n\n'
                                + `${(newUsername) ? '    - Username\n' : ''}`
                                + `${(newPassword) ? '    - Password\n' : ''}`
                                + `${(newEmail) ? '    - Email\n' : ''}`
                                + `\n\n\nIf you did not make any of these changes, or were not expecting this email, you can reply to this email or contact: ${process.env['EMAIL_ADDRESS']}\n`
                        }, (err, info) => {
                            if (err) {
                                if (this.txtLogger) this.txtLogger.writeToLogFile(`Error sending account update email: ${err}\n${info?.response}`);
                                reject(false);
                            } else {
                                if (this.txtLogger) this.txtLogger.writeToLogFile(`Account recovery update sent: ${info.response}`);
                                resolve(true);
                            }
                        });
                    });

                    return success;
                } catch (err) {
                    if (this.txtLogger) this.txtLogger.writeToLogFile(`Error sending admin email: ${err}`);
                    return false;
                }
            } else {
                return false;
            }
        } catch (err) {
            if (this.txtLogger) this.txtLogger.writeToLogFile(`Error sending admin email: ${err}`);
            return false;
        }
    }


    public async sendContactEmail(email: string, name: string, message: string): Promise<boolean> {
        let success: boolean = false;

        try {
            if (this.transporter) {
                try {
                    success = await new Promise<boolean>((resolve, reject) => {
                        this.transporter.sendMail({
                            from: process.env['EMAIL_ADDRESS'],
                            to: process.env['MENCAP_EMAIL_ADDRESS'],
                            subject: '[Website Message] Someone has reached out through the Mencap Website...',
                            text:
                                'Hi,\n\n' +
                                '****Internal Message to Staff****\n' +
                                'This is an automatic email from the Mencap Liverpool & Sefton website; it is internal and perfectly safe. HOWEVER, the message itself below, is external and might not be safe!\n' +
                                'So please check all contents of the below message carefully: Make sure there are no dangerous links or email addresses, that lead to a scam or virus.\n' +
                                'You can tell when a link or email address looks suspicious, not quite right, or one you do not recognise. IF IN DOUBT, NEVER CLICK ANY LINKS OR DOWNLOAD ANY FILES!\n' +
                                '****End of Staff Message****\n\n\n\n' +
                                'Someone has reached out through the Mencap website. You can see the full details below:\n\n' +
                                `Name (of person who left this message):  ${name}\n` +
                                `Email (of person who left this message):  ${email}\n` +
                                `Message:\n"${message}"\n` +
                                `\n\n\n\nIf you suspect something is wrong with this email, delete it. You can also contact: ${process.env['EMAIL_ADDRESS']}\n`
                        }, (err, info) => {
                            if (err) {
                                if (this.txtLogger) this.txtLogger.writeToLogFile(`Error sending contact message email: ${err}\n${info?.response}`);
                                reject(false);
                            } else {
                                if (this.txtLogger) this.txtLogger.writeToLogFile(`Contact message email sent: ${info.response}`);
                                resolve(true);
                            }
                        });
                    });
    
                    return success;
                } catch (err) {
                    if (this.txtLogger) this.txtLogger.writeToLogFile(`Error sending admin email: ${err}`);
                    return false;
                }
            } else {
                return false;
            }
        } catch (err) {
            if (this.txtLogger) this.txtLogger.writeToLogFile(`Error sending admin email: ${err}`);
            return false;
        }
    }
}
