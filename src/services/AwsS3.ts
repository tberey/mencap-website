import { SimpleTxtLogger } from 'simple-txt-logger';
import { Helper } from './Helper';
import {
    S3Client,
    ListBucketsCommand,
    ListObjectsCommand,
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand,
    HeadObjectCommand
} from "@aws-sdk/client-s3";
import fs from 'fs';
import path from 'path';


type DeleteObjectsCommandInput = {
    Bucket: string;
    Delete: {
        Objects: Array<{ Key: string }>;
    };
};


export class AwsS3 {

    private AWS_S3: S3Client;
    private txtLogger: SimpleTxtLogger;


    constructor(region: string, accessKey: string, secretAccessKey: string, txtLogger: SimpleTxtLogger) {
        this.txtLogger = txtLogger;

        this.AWS_S3 = new S3Client({
            region,
            credentials: {
                accessKeyId: accessKey,
                secretAccessKey: secretAccessKey,
            },
        });

        this.txtLogger.writeToLogFile('Configured AWS S3.');
    }


    public async listOrFindBuckets(findBucket?: string): Promise<number | string[]> {
        if (findBucket) findBucket = Helper.bucketFormat(findBucket);
        this.txtLogger.writeToLogFile((findBucket) ? `Find bucket '${findBucket}'.` : 'List all buckets.');

        try {
            const data = await this.AWS_S3.send(new ListBucketsCommand({}));
            if (!data.Buckets?.length) return findBucket ? 404 : [];

            this.txtLogger.writeToLogFile('All Buckets:');
            const bucketsArray: string[] = data.Buckets.map((val) => {
                if (!val.Name) return '';
                this.txtLogger.writeToLogFile(`'${val.Name}';`);
                return val.Name;
            });

            if (findBucket) {
                if (bucketsArray.includes(findBucket)) {
                    this.txtLogger.writeToLogFile(`Found bucket '${findBucket}'.`);
                    return 200;
                } else {
                    this.txtLogger.writeToLogFile('Bucket Not Found.');
                    return 404;
                }
            } else {
                return bucketsArray;
            }
        } catch (err) {
            this.txtLogger.writeToLogFile(`Error while finding or listing buckets: ${err}`);
            return 500;
        }
    }

    public async listOrFindObjects(bucketName: string, folderName: string, findObject?: string, emptyRequest?: boolean): Promise<number | string[] | DeleteObjectsCommandInput> {
        bucketName = Helper.bucketFormat(bucketName);
        this.txtLogger.writeToLogFile((findObject) ? `Find object '${findObject}' in bucket '${bucketName}'.` : `List all objects in bucket '${bucketName}'.`);

        const result = await this.listOrFindBuckets(bucketName);
        if (result === 500) return 500;
        if (result !== 200) {
            this.txtLogger.writeToLogFile(`Could not find Bucket '${bucketName}'. Failed to list Objects.`);
            return 400;
        }

        try {
            const data = await this.AWS_S3.send(new ListObjectsCommand({ Bucket: bucketName }));
            if (!data.Contents?.length) {
                if (emptyRequest) return {
                    Bucket: bucketName,
                    Delete: {
                        Objects: [],
                    },
                };
                this.txtLogger.writeToLogFile(`No Objects in Bucket '${bucketName}'.`);
                return 404;
            }

            this.txtLogger.writeToLogFile(`All Objects in Bucket '${bucketName}':`);
            const objectsArray: string[] = data.Contents.map((val) => {
                if (!val.Key) return '';
                this.txtLogger.writeToLogFile(`'${val.Key}';`);
                if (emptyRequest) return '';
                return `'${val.Key}'`;
            });

            if (emptyRequest) {
                const params: DeleteObjectsCommandInput = {
                    Bucket: bucketName,
                    Delete: {
                        Objects: data.Contents.map((key) => ({ Key: key.Key || 'ERROR' })),
                    },
                };
                return params;

            } else if (findObject) {
                let statusCode: number = 404;

                for (const object of objectsArray) {
                    if (`'${folderName}/${findObject}'` == object.toString()) {
                        this.txtLogger.writeToLogFile(`Found object '${findObject}'`);
                        return statusCode = 200;
                    }
                }
                return statusCode;

            } else return objectsArray;

        } catch (err) {
            this.txtLogger.writeToLogFile(`Error trying to list objects in bucket: ${err}`);
            return 500;
        }
    }

    public async uploadFile(filePath: string, bucketName: string, folderName?: string, fileName?: string): Promise<number> {
        if (bucketName) bucketName = Helper.bucketFormat(bucketName);
        this.txtLogger.writeToLogFile(`Upload item '${filePath}' to bucket '${bucketName}'.`);

        const normalizedPath = path.resolve(filePath);

        const validPathPattern = /^[a-zA-Z0-9 _\-\/\\\.]+$/;
        if (!validPathPattern.test(normalizedPath)) {
            this.txtLogger.writeToLogFile(`Invalid file path: '${normalizedPath}'.`);
            return 400;
        }

        const file = normalizedPath.substring(normalizedPath.lastIndexOf('/') + 1);
        const key = folderName ? (fileName ? `${folderName}/${fileName}` : `${folderName}/${file}`) : (fileName ? `${fileName}` : `${file}`);

        if (folderName && !validPathPattern.test(folderName)) {
            this.txtLogger.writeToLogFile(`Invalid folder name: '${folderName}'.`);
            return 400;
        }

        if (folderName) {
            try {
                const folderExists = await this.checkBucketFolder(bucketName, folderName);
                if (!folderExists) await this.createFolder(bucketName, folderName);
            } catch (err) {
                this.txtLogger.writeToLogFile(`An error occurred during file upload. Failed to upload '${file}'.`);
                return 500;
            }
        }

        const result = await this.listOrFindObjects(bucketName, folderName? folderName : 'folderName', fileName ? fileName : file);

        if (result === 200) {
            this.txtLogger.writeToLogFile(`File already in bucket '${bucketName}'. Failed to upload '${file}'.`);
            return 400;
        } else if (result === 400) {
            this.txtLogger.writeToLogFile(`Bucket '${bucketName}' does not exist. Failed to upload '${file}'.`);
            return 400;
        } else if (result === 500) {
            this.txtLogger.writeToLogFile(`An error occurred during file upload. Failed to upload '${file}'.`);
            return 500;
        }

        const fsFile = fs.createReadStream(normalizedPath);
        const params = new PutObjectCommand({
            Bucket: bucketName,
            Key: key,
            Body: fsFile,
        });

        try {
            await this.AWS_S3.send(params);
            this.txtLogger.writeToLogFile(`Successfully uploaded '${fileName ? fileName : file}' to bucket '${bucketName}'`);
            return 200;
        } catch (err) {
            this.txtLogger.writeToLogFile(`Error uploading file to bucket: ${err}`);
            return 500;
        } finally {
            fsFile.close();
        }
    }

    public async deleteFile(bucketName: string, folderName: string, fileName: string): Promise<number> {
        if (bucketName) bucketName = Helper.bucketFormat(bucketName);
        this.txtLogger.writeToLogFile(`Deleting item '${fileName}' from bucket '${bucketName}'.`);

        const key = folderName ? (fileName ? `${folderName}/${fileName}`: `${folderName}/${fileName}`) : (fileName ? `${fileName}`: `${fileName}`);

        if (folderName) {
            try {
                const folderExists = await this.checkBucketFolder(bucketName, folderName);

                if (!folderExists) {
                    this.txtLogger.writeToLogFile(`Bucket folder does not exist. Failed to delete '${fileName}'.`);
                    return 400;
                }
            } catch (err) {
                this.txtLogger.writeToLogFile(`An error occurred during file deletion. Failed to delete '${fileName}'.`);
                return 500;
            }
        }

        const result = await this.listOrFindObjects(bucketName, folderName, fileName);

        if (result === 200) {
            const params = new DeleteObjectCommand({
                Bucket: bucketName,
                Key: key,
            });

            try {
                await this.AWS_S3.send(params);
                this.txtLogger.writeToLogFile(`Successfully deleted '${fileName}' from bucket '${bucketName}'`);

                return 200;

            } catch (err) {
                this.txtLogger.writeToLogFile(`Error deleting file from bucket: ${err}`);

                return 500;
            }

        } else if (result === 400) {
            this.txtLogger.writeToLogFile(`Bucket '${bucketName}' does not exist. Failed to delete '${fileName}'.`);
            return 400;
        } else {
            this.txtLogger.writeToLogFile(`An error occurred during file delete. Failed to delete '${fileName}'.`);
            return 500;
        }
    }

    public async downloadFile(bucketName: string, fileName: string): Promise<number> {
        bucketName = Helper.bucketFormat(bucketName);
        const result = await this.listOrFindObjects(bucketName, 'folderName', fileName);

        if (result === 400) {
            this.txtLogger.writeToLogFile(`Bucket '${bucketName}' does not exist. Failed to download '${fileName}'.`);
            return result;
        } else if (result === 404) {
            this.txtLogger.writeToLogFile(`'${bucketName}' does not contain '${fileName}'. Failed to download file.`);
            return result;
        } else if (result === 500) {
            this.txtLogger.writeToLogFile(`An error occurred when checking if the file exists.`);
            return result;
        }

        if (result) {
            try {
                await fs.promises.access(`downloads/${fileName}`, fs.constants.F_OK);
                this.txtLogger.writeToLogFile(`'${fileName}' already exists locally in downloads folder. Failed to download file.`);
                return 400;
            } catch {
                this.txtLogger.writeToLogFile(`File does not already exist. Carrying on with download.`);
            }
        }

        const params = new GetObjectCommand({
            Bucket: bucketName,
            Key: fileName,
        });
    
        try {
            const data = await this.AWS_S3.send(params);
    
            if (!fs.existsSync('downloads')) fs.mkdirSync('downloads');
            const filePath = `downloads/${fileName}`;
    
            if (fs.existsSync(filePath)) {
                this.txtLogger.writeToLogFile(`'${fileName}' already exists locally in downloads folder. Failed to download file.`);
                return 500;
            }
    
            const writableStream = fs.createWriteStream(filePath);
            const readableStream = data.Body as NodeJS.ReadableStream;

            readableStream.pipe(writableStream);

            return new Promise<number>((resolve, reject) => {
                writableStream.on('error', (err) => {
                    this.txtLogger.writeToLogFile(`Error downloading file from bucket: ${err}`);
                    writableStream.close();
                    reject(500);
                });
        
                writableStream.on('close', () => {
                    this.txtLogger.writeToLogFile(`Successfully downloaded '${fileName}' from bucket '${bucketName}' to './downloads'`);
                    writableStream.close();
                    resolve(200);
                });
            });
        } catch (err) {
            this.txtLogger.writeToLogFile(`Error downloading file from bucket: ${err}`);
            return 500;
        }
    }


    private async createFolder(bucketName: string, folderName: string): Promise<void> {
        try {
            const params = new PutObjectCommand({
                Bucket: bucketName,
                Key: `${folderName}/`,
                Body: '',
                ContentLength: 0
            });
            await this.AWS_S3.send(params);
        } catch (err) {
            this.txtLogger.writeToLogFile(`Error creating folder: ${err}`);
            throw err;
        }
    }

    private async checkBucketFolder(bucketName: string, folderName: string): Promise<boolean> {
        try {
            const params = { Bucket: bucketName, Key: folderName + '/' };
            await this.AWS_S3.send(new HeadObjectCommand(params));
            return true;
        } catch (err: any) {
            if (err.name === 'NotFound') {
                return false;
            }
            this.txtLogger.writeToLogFile(`Error checking folder in bucket: ${err}`);
            return false;
        }
    }
}
