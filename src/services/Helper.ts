
export class Helper {

    static newDateTime(): string {
        const date = new Date().toUTCString();
        return date.substring(0, date.indexOf(':')-3).replace(',','').replace(/[ \s]/g, '_');
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

    static parseDate(date: string | Date): number | null {
        if (date) return new Date(date).getTime();
        return null
    }

    static formatDate(dateString: string): string {
        const date = new Date(dateString);

        // Array of days and months
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

        // Get day, month, and year
        const dayName = days[date.getUTCDay()];
        const dayNumber = date.getUTCDate();
        const monthName = months[date.getUTCMonth()];
        const year = date.getUTCFullYear();
        const suffixes = ['th', 'st', 'nd', 'rd'];

        // Add ordinal suffix
        const ordinalSuffix = (n: number): string => {
            const value = n % 100;
            // Ensure the index is valid
            const suffixIndex = (value >= 10 && value <= 20) ? 0 : (value % 10);
            return n + (suffixes[suffixIndex] || suffixes[0]!);
        };

        return `${dayName} ${ordinalSuffix(dayNumber)} ${monthName} ${year}`;
    }
}