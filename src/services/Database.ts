import { SimpleTxtLogger } from 'simple-txt-logger';
import mysql, { Pool, PoolConnection } from 'mysql';
import * as bcrypt from 'bcrypt';
import util from 'util';


type queryUsersRead = {
    username: string,
    password: string,
    email: string,
    membership: string,
    uid: string,
    sid: string
};

type queryArticlesRead = {
    ID: string,
    title: string,
    date: string,
    body: string,
    file: string,
    fileName: string,
    imgThumb: string,
    imgMain: string,
    author: string,
    userUid: string
};

type queryEventsRead = {
    ID: string,
    title: string,
    startDateTime: Date,
    endDateTime: Date,
    description: string,
    recurring: string,
    allDay: boolean,
    author: string,
    userUid: string
};

type queryGalleryRead = {
    ID: string,
    monthName: string,
    month: string,
    year: string,
    media: string,
    author: string,
    userUid: string
};

type queryWrite = {
    affectedRows: number,
    changedRows: number
};

type Columns = 'ID' | 'username' | 'password' | 'email' | 'uid' | 'sid' | 'membership' | 'title' | 'body' | 'file' | 'fileName' | 'imgThumb' | 'imgMain' | 'author' | 'userUid' | 'startDateTime' | 'endDateTime' | 'description' | 'recurring' | 'allDay';
type Membership = 'staff';


export type { queryArticlesRead, queryEventsRead, queryGalleryRead, queryUsersRead };


export class Database {

    private dbConnection: Pool;
    private dbTables: string[] = ['users','articles','events','gallery'];

    private dbTxtLogger: SimpleTxtLogger;
    private txtLogger: SimpleTxtLogger | undefined;

    public constructor(databaseName: string, host: string, user: string, password: string, txtLogger?: SimpleTxtLogger) {
        if (txtLogger) this.txtLogger = txtLogger;
        this.dbTxtLogger = new SimpleTxtLogger(SimpleTxtLogger.newDateTime(), 'Database', 'MySQL_DB');

        this.dbTables;
        this.dbConnection = mysql.createPool({
            connectionLimit: 5,
            'host': host,
            'user': user,
            'password': password,
            'database': databaseName
        });

        this.createTables()
            .then(() => {
                if (this.txtLogger) this.txtLogger.writeToLogFile('Configured Database.');
            })
            .catch((err) => {
                if (this.txtLogger) this.txtLogger.writeToLogFile(`DB Error: [creating table] ${err}`);
            });
    }

    private async open(): Promise<PoolConnection> {
        const getConnection = util.promisify(this.dbConnection.getConnection).bind(this.dbConnection);

        try {
            const connection = await getConnection();
            if (this.txtLogger) this.txtLogger.writeToLogFile('Database Connected.');
            return connection;

        } catch (err) {
            if (this.txtLogger) this.txtLogger.writeToLogFile(`DB Error: [opening connection]  ${err}`);
            throw err;
        }
    }

    private async close(connection: PoolConnection): Promise<void> {
        try {
            connection.release();
            if (this.txtLogger) this.txtLogger.writeToLogFile('Database Disconnected.');

        } catch (err) {
            if (this.txtLogger) this.txtLogger.writeToLogFile(`DB Error: [releasing connection]  ${err}`);
            throw err;
        }
    }

    protected async disconnect(): Promise<void> {
        try {
            await util.promisify(this.dbConnection.end).bind(this.dbConnection)();
            if (this.txtLogger) this.txtLogger.writeToLogFile('Database Shutdown.');

        } catch (err) {
            if (this.txtLogger) this.txtLogger.writeToLogFile(`DB Error: [closing connection]  ${err}`);
            throw err;
        }
    }

    private async createTables(): Promise<void> {
        const connection = await this.open();

        try {
            const query: string = `CREATE TABLE IF NOT EXISTS ?? (
                ID INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(100) NOT NULL UNIQUE,
                password VARCHAR(150) NOT NULL,
                email VARCHAR(200) NOT NULL UNIQUE,
                membership VARCHAR(20) NOT NULL,
                uid CHAR(36) NOT NULL UNIQUE,
                sid CHAR(14) NOT NULL UNIQUE,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )`;

            const queryUidTrigger: string = 'DELIMITER ;;\n'
                +'CREATE TRIGGER uid_trigger\n'
                +'BEFORE INSERT ON ??\n'
                +'FOR EACH ROW\n'
                +'BEGIN\n'
                +'  IF new.uid IS NULL THEN\n'
                +'    SET new.uid = uuid();\n'
                +'  END IF;\n'
                +'END;;\n'
                +'DELIMITER ;';

            const querySidTrigger: string = 'DELIMITER ;;\n'
                +'CREATE TRIGGER sid_trigger\n'
                +'BEFORE INSERT ON ??\n'
                +'FOR EACH ROW\n'
                +'BEGIN\n'
                +'  IF new.sid IS NULL THEN\n'
                +'    SET new.sid = hex(random_bytes(7));\n'
                +'  END IF;\n'
                +'END;;\n'
                +'DELIMITER ;';

            const query2: string = `CREATE TABLE IF NOT EXISTS ?? (
                ID INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(300) NOT NULL,
                date VARCHAR(100) NOT NULL,
                body TEXT NOT NULL,
                file VARCHAR(100) NULL,
                fileName VARCHAR(100) NULL,
                imgThumb VARCHAR(100) NULL,
                imgMain VARCHAR(100) NULL,
                author VARCHAR(100) NOT NULL,
                userUid CHAR(36) NOT NULL,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )`;

            const query3: string = `CREATE TABLE IF NOT EXISTS ?? (
                ID INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(150) NOT NULL,
                startDateTime DATETIME NOT NULL,
                endDateTime DATETIME NOT NULL,
                recurring VARCHAR(20),
                allDay BOOLEAN NOT NULL DEFAULT FALSE,
                description VARCHAR(300),
                author VARCHAR(100) NOT NULL,
                userUid CHAR(36) NOT NULL,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )`;

            const query4: string = `CREATE TABLE IF NOT EXISTS ?? (
                ID INT AUTO_INCREMENT PRIMARY KEY,
                month INT NOT NULL,
                year VARCHAR(4) NOT NULL,
                media VARCHAR(100) NOT NULL,
                author VARCHAR(100) NOT NULL,
                userUid CHAR(36) NOT NULL,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )`;

            await this.query(connection, query, [this.dbTables[0]!]);
            await this.query(connection, queryUidTrigger, [this.dbTables[0]!]);
            await this.query(connection, querySidTrigger, [this.dbTables[0]!]);
            await this.query(connection, query2, [this.dbTables[1]!]);
            await this.query(connection, query3, [this.dbTables[2]!]);
            await this.query(connection, query4, [this.dbTables[3]!]);

            this.dbTxtLogger.writeToLogFile('Config Success: Database table created or exists.');

        } catch (err) {
            this.dbTxtLogger.writeToLogFile(`Config Error: ${err}.`);
            throw err;

        } finally {
            await this.close(connection);
        }
    }

    private async query(connection: PoolConnection, query: string, inserts: Array<string | number | boolean | string[]>): Promise<queryWrite | queryUsersRead[] | queryArticlesRead[] | queryEventsRead[] | queryGalleryRead[]> {
        const formattedQuery = mysql.format(query, inserts);

        this.dbTxtLogger.writeToLogFile(`Querying: ${formattedQuery}`);

        const queryFunction = util.promisify(connection.query).bind(connection);
        const result = await queryFunction(formattedQuery) as queryWrite | queryUsersRead[] | queryArticlesRead[] | queryEventsRead[] | queryGalleryRead[];
        
        if (result && typeof result === 'object') {
            return result;
        }

        throw new Error('Query result is not valid.');
    }

    public async checkData(data: string, column: Columns): Promise<boolean> {
        const connection = await this.open();

        try {
            const query: string = 'SELECT ?? FROM ?? WHERE ?? = ?';
            const inserts: string[] = [column, this.dbTables[0]!, column, data];

            const result = await this.query(connection, query, inserts) as queryUsersRead[] | queryArticlesRead[] | queryEventsRead[];

            this.dbTxtLogger.writeToLogFile(`Query Results: ${result}`);
            
            if (result[0] && (result[0] as any)[column] == data) return true;
            return false;

        } catch (err) {
            this.dbTxtLogger.writeToLogFile(`Error Querying: ${err}`);
            return false;

        } finally {
            await this.close(connection);
        }
    }

    public async crossCheckData(data: string, column: Columns, Xdata: string, Xcol: string): Promise<boolean> {
        const connection = await this.open();

        try {
            const query: string = 'SELECT ?? FROM ?? WHERE ?? = ? AND ?? = ?';
            const inserts: Array<string | string[]> = [[column, Xcol], this.dbTables[0]!, column, data, Xcol, Xdata];

            const result = await this.query(connection, query, inserts) as queryUsersRead[] | queryArticlesRead[] | queryEventsRead[];

            this.dbTxtLogger.writeToLogFile(`Query Results: ${result}`);
            
            if (result[0] && ((result[0] as any)[column] == data) && ((result[0] as any)[Xcol] == Xdata)) return true;
            return false;

        } catch (err) {
            this.dbTxtLogger.writeToLogFile(`Error Querying: ${err}`);
            return false;

        } finally {
            await this.close(connection);
        }
    }

    public async getData(column: Columns, constraintColumn: Columns, constraint: string): Promise<string | null> {
        const connection = await this.open();
        
        try {
            const query: string = 'SELECT ?? FROM ?? WHERE ?? = ?';
            const inserts: string[] = [column, this.dbTables[0]!, constraintColumn, constraint];

            const result = await this.query(connection, query, inserts) as queryUsersRead[] | queryArticlesRead[] | queryEventsRead[];

            this.dbTxtLogger.writeToLogFile(`Query Results: ${result}`);
            
            if (result && result[0]) return (result[0] as any)[column] as string;
            return null;

        } catch (err) {
            this.dbTxtLogger.writeToLogFile(`Error Querying: ${err}`);
            return null;

        } finally {
            await this.close(connection);
        }
    }

    public async updateData(data: string, dataColumn: Columns, constraintColumn: Columns, constraint: string): Promise<boolean> {
        const connection = await this.open();

        try {
            if (dataColumn == 'password') {
                data = await this.hashPassword(data)
            };

            const query: string = 'UPDATE ?? SET ?? = ? WHERE ?? = ?';
            const inserts: string[] = [this.dbTables[0]!, dataColumn, data, constraintColumn, constraint];

            const results = await this.query(connection, query, inserts) as queryWrite;
            this.dbTxtLogger.writeToLogFile(`Query Results: ${results}`);
            
            if (results && results.affectedRows > 0) return true;
            return false;

        } catch (err) {
            this.dbTxtLogger.writeToLogFile(`Error Querying: ${err}`);
            return false;

        } finally {
            await this.close(connection);
        }
    }

    public async login(username: string, password: string): Promise<null | queryUsersRead> {
        const connection = await this.open();
        
        try {
            const query: string = 'SELECT ?? FROM ?? WHERE ?? = ?';
            const inserts: Array<string | string[]> = [['username', 'password', 'email', 'membership', 'uid', 'sid'], this.dbTables[0]!, 'username', username];

            let results = await this.query(connection, query, inserts) as queryUsersRead[];
            this.dbTxtLogger.writeToLogFile(`Query Results: ${results}`);

            if (results[0] && results[0].username && username && results[0].username == username && results[0].password && password && await this.compareHash(password, results[0].password)) {
                results[0].password = '';
                return results[0];
            }

            return null;

        } catch (err) {
            this.dbTxtLogger.writeToLogFile(`Error Querying: ${err}`);
            return null;

        } finally {
            await this.close(connection);
        }
    }

    public async getArticles(limit: number): Promise<queryArticlesRead[] | null> {
        const connection = await this.open();
        
        try {
            const query: string = 'SELECT ?? FROM ?? ORDER BY ?? DESC LIMIT ?';
            const inserts: Array<string | string[] | number> = [['ID', 'title', 'date', 'body', 'author', 'createdAt', 'imgThumb', 'imgMain', 'file', 'fileName', 'userUid'], this.dbTables[1]!, 'createdAt', limit];

            const result: queryArticlesRead[] = await this.query(connection, query, inserts) as queryArticlesRead[];

            this.dbTxtLogger.writeToLogFile(`Query Results: ${result}`);

            if (result) return result;
            return null;

        } catch (err) {
            this.dbTxtLogger.writeToLogFile(`Error Querying: ${err}`);
            return null;

        } finally {
            await this.close(connection);
        }
    }

    public async createArticle(title: string, date: string, body: string, author: string, userUid: string, imgThumb?: string, imgMain?: string, file?: string, fileName?: string): Promise<boolean> {
        const connection = await this.open();
        
        try {
            let query: string = 'INSERT INTO ?? (title, date, body, author, userUid';
            let inserts: string[] = [this.dbTables[1]!, title, date, body, author, userUid];

            if (imgThumb) {
                query += ', imgThumb';
                inserts.push(imgThumb);
            }

            if (imgMain) {
                query += ', imgMain';
                inserts.push(imgMain);
            }

            if (file) {
                query += ', file';
                inserts.push(file);
            }

            if (fileName) {
                query += ', fileName';
                inserts.push(fileName);
            }
            query += ') VALUES (' + Array(inserts.length - 1).fill('?').join(', ') + ')';

            const result: queryWrite = await this.query(connection, query, inserts) as queryWrite;
            this.dbTxtLogger.writeToLogFile(`Query Results: ${result}`);

            if (result && result.affectedRows > 0) return true;
            return false;

        } catch (err) {
            this.dbTxtLogger.writeToLogFile(`Error Querying: ${err}`);
            return false;

        } finally {
            await this.close(connection);
        }
    }

    public async deleteArticle(id: string, userUid: string): Promise<boolean> {
        const connection = await this.open();
        
        try {
            const query: string = 'DELETE FROM ?? WHERE ?? = ? AND ?? = ?';
            const inserts: Array<string> = [this.dbTables[1]!, 'userUid', userUid, 'id', id];

            const result: queryWrite = await this.query(connection, query, inserts) as queryWrite;
            this.dbTxtLogger.writeToLogFile(`Query Results: ${result}`);

            if (result && result.affectedRows > 0) return true;
            return false;

        } catch (err) {
            this.dbTxtLogger.writeToLogFile(`Error Querying: ${err}`);
            return false;

        } finally {
            await this.close(connection);
        }
    }

    public async getGalleryMediaByYear(limit: number, year: string): Promise<queryGalleryRead[] | null> {
        const connection = await this.open();
        
        try {
            const query: string = 'SELECT ?? FROM ?? WHERE ?? = ? ORDER BY ?? DESC LIMIT ?';
            const inserts: Array<string | number | string[]> = [['ID','media','month','userUid'], this.dbTables[3]!, 'year', year, 'createdAt', limit];

            const result: queryGalleryRead[] = await this.query(connection, query, inserts) as queryGalleryRead[];

            this.dbTxtLogger.writeToLogFile(`Query Results: ${result}`);

            if (result) return result;
            return null;

        } catch (err) {
            this.dbTxtLogger.writeToLogFile(`Error Querying: ${err}`);
            return null;

        } finally {
            await this.close(connection);
        }
    }

    public async getGalleryMonthsByYear(year: string): Promise<queryGalleryRead[] | null> {
        const connection = await this.open();
        
        try {
            const query: string = 'SELECT DISTINCT ?? FROM ?? WHERE ?? = ? ORDER BY ?? DESC';
            const inserts: string[] = ['month', this.dbTables[3]!, 'year', year, 'month'];

            const result: queryGalleryRead[] = await this.query(connection, query, inserts) as queryGalleryRead[];

            this.dbTxtLogger.writeToLogFile(`Query Results: ${result}`);

            if (result) return result;
            return null;

        } catch (err) {
            this.dbTxtLogger.writeToLogFile(`Error Querying: ${err}`);
            return null;

        } finally {
            await this.close(connection);
        }
    }

    public async getGalleryYears(): Promise<queryGalleryRead[] | null> {
        const connection = await this.open();
        
        try {
            const query: string = 'SELECT DISTINCT ?? FROM ?? ORDER BY ?? DESC';
            const inserts: string[] = ['year', this.dbTables[3]!, 'year'];

            const result: queryGalleryRead[] = await this.query(connection, query, inserts) as queryGalleryRead[];

            this.dbTxtLogger.writeToLogFile(`Query Results: ${result}`);

            if (result) return result;
            return null;

        } catch (err) {
            this.dbTxtLogger.writeToLogFile(`Error Querying: ${err}`);
            return null;

        } finally {
            await this.close(connection);
        }
    }

    public async createGalleryMedia(month: string, year: string, author: string, userUid: string, media: string): Promise<boolean> {
        const connection = await this.open();
        
        try {
            const query: string = 'INSERT INTO ?? (??, ??, ??, ??, ??) VALUES (?, ?, ?, ?, ?)';
            const inserts: string[] = [this.dbTables[3]!, 'month', 'year', 'media', 'author', 'userUid', month, year, media, author, userUid];

            const results: queryWrite = await this.query(connection, query, inserts) as queryWrite;
            this.dbTxtLogger.writeToLogFile(`Query Results: ${results}`);

            if (results && results.affectedRows > 0) return true;
            return false;

        } catch (err) {
            this.dbTxtLogger.writeToLogFile(`Error Querying: ${err}`);
            return false;

        } finally {
            await this.close(connection);
        }
    }

    public async deleteGalleryMedia(id: string, userUid: string): Promise<boolean> {
        const connection = await this.open();
        
        try {
            const query: string = 'DELETE FROM ?? WHERE ?? = ? AND ?? = ?';
            const inserts: Array<string> = [this.dbTables[3]!, 'userUid', userUid, 'id', id];

            const result: queryWrite = await this.query(connection, query, inserts) as queryWrite;
            this.dbTxtLogger.writeToLogFile(`Query Results: ${result}`);

            if (result && result.affectedRows > 0) return true;
            return false;

        } catch (err) {
            this.dbTxtLogger.writeToLogFile(`Error Querying: ${err}`);
            return false;

        } finally {
            await this.close(connection);
        }
    }

    public async getEvents(limit: number): Promise<queryEventsRead[] | null> {
        const connection = await this.open();
        
        try {
            const query: string = 'SELECT ?? FROM ?? LIMIT ?';
            const inserts: Array<string | number | string[]> = [['ID', 'title', 'startDateTime', 'endDateTime', 'description', 'recurring', 'allDay', 'author', 'userUid'], this.dbTables[2]!, limit];

            const result: queryEventsRead[] = await this.query(connection, query, inserts) as queryEventsRead[];

            this.dbTxtLogger.writeToLogFile(`Query Results: ${result}`);

            if (result) return result;
            return null;

        } catch (err) {
            this.dbTxtLogger.writeToLogFile(`Error Querying: ${err}`);
            return null;

        } finally {
            await this.close(connection);
        }
    }

    public async createEvent(title: string, startDateTime: string, endDateTime: string, recurring: string, allDay: boolean, author: string, userUid: string): Promise<boolean> {
        const connection = await this.open();
        
        try {
            const query: string = 'INSERT INTO ?? (??, ??, ??, ??, ??, ??, ??) VALUES (?, ?, ?, ?, ?, ?, ?)';
            const inserts: Array<string | boolean> = [this.dbTables[2]!, 'title', 'startDateTime', 'endDateTime', 'recurring', 'allDay', 'author', 'userUid', title, startDateTime, endDateTime, recurring, allDay, author, userUid];

            const results: queryWrite = await this.query(connection, query, inserts) as queryWrite;

            this.dbTxtLogger.writeToLogFile(`Query Results: ${results}`);

            if (results && results.affectedRows > 0) return true;
            return false;

        } catch (err) {
            this.dbTxtLogger.writeToLogFile(`Error Querying: ${err}`);
            return false;

        } finally {
            await this.close(connection);
        }
    }

    public async deleteEvent(id: string, userUid: string): Promise<boolean> {
        const connection = await this.open();
        
        try {
            const query: string = 'DELETE FROM ?? WHERE ?? = ? AND ?? = ?';
            const inserts: Array<string> = [this.dbTables[2]!, 'userUid', userUid, 'id', id];

            const result: queryWrite = await this.query(connection, query, inserts) as queryWrite;
            this.dbTxtLogger.writeToLogFile(`Query Results: ${result}`);

            if (result && result.affectedRows > 0) return true;
            return false;

        } catch (err) {
            this.dbTxtLogger.writeToLogFile(`Error Querying: ${err}`);
            return false;

        } finally {
            await this.close(connection);
        }
    }

    public async updateAccount(currentEmail: string, username?: string, password?: string, email?: string, membership?: Membership): Promise<boolean> {
        if (!username && !password && !email && !membership) return false;

        const connection = await this.open();

        try {
            const fieldsToUpdate: string[] = [];
            const valuesToUpdate: string[] = [];

            if (username) {
                fieldsToUpdate.push('username = ?');
                valuesToUpdate.push(username);
            }

            if (password) {
                fieldsToUpdate.push('password = ?');
                valuesToUpdate.push(await this.hashPassword(password));
            }

            if (email) {
                fieldsToUpdate.push('email = ?');
                valuesToUpdate.push(email);
            }

            if (membership) {
                fieldsToUpdate.push('membership = ?');
                valuesToUpdate.push(membership);
            }

            const query: string = `UPDATE ?? SET ${fieldsToUpdate.join(', ')} WHERE ?? = ?`;
            const inserts: string[] = [this.dbTables[0]!, ...valuesToUpdate, 'email', currentEmail];

            const results = await this.query(connection, query, inserts) as queryWrite;
            this.dbTxtLogger.writeToLogFile(`Query Results: ${results}`);

            if (results && results.affectedRows > 0) return true;
            return false;

        } catch (err) {
            this.dbTxtLogger.writeToLogFile(`Error Querying: ${err}`);
            return false;

        } finally {
            await this.close(connection);
        }
    }


    private async hashPassword(password: string): Promise<string> {
        const saltRounds: number = 10;
        const hashedPassword: string = await bcrypt.hash(password, saltRounds);
        return hashedPassword;
    }

    private async compareHash(password: string, hashedPassword: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            bcrypt.compare(password, hashedPassword, (err, result) => {
                if (err) {
                    this.dbTxtLogger.writeToLogFile(`Error comparing passwords: ${err}`);
                    reject(false);
                } else {
                    resolve(result);
                }
            });
        });
    }
}