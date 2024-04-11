export class Helper {

    static newDateTime(): string {
        const date = new Date().toUTCString();
        return date.substring(0, date.indexOf(':')-3).replace(',','').replace(/[ \s]/g, '_');
    }

    static generateRandomPassword(length: number): string {
        const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let password: string = '';

        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * charset.length);
            password += charset[randomIndex];
        }

        return password;
    }

    static bucketFormat(bucketName: string): string {
        bucketName = bucketName.toLowerCase().trim().replace(/_/g, '-').replace(/ /g, '-');
        return bucketName;
    }

    static searchTerm(term: string): string {
        term = term.toLowerCase().trim();
        if (term.includes('.')) term = term.substr(0, term.indexOf('.'));
        return term;
    }

    static getMonthName = (month: string): string | undefined => {
        const monthNumber = parseInt(month, 10);
        
        if (isNaN(monthNumber) || monthNumber < 1 || monthNumber > 12) return undefined;

        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'
        ];

        return monthNames[monthNumber - 1];
    };
}