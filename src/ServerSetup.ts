import { SimpleTxtLogger } from 'simple-txt-logger';
import { Rollbar } from './services/Rollbar';
import { Database } from './services/Database';
import { AwsS3 } from './services/AwsS3';
import express, { Express, Router } from 'express';
import session from "express-session";
import dotenv from 'dotenv';
import http from 'http';
import cors from 'cors';
import nodemailer, { Transporter } from 'nodemailer';


declare module 'express-session' {
    interface SessionData {
        loggedin: boolean;
        username: string;
        uid: string;
        sid: string;
        contactPosts: number;
        resetPosts: number;
    }
}


export class ServerSetup {
    private port: string;
    private hostname: string;
    private server: http.Server;
    private app: Express;

    protected txtLogger: SimpleTxtLogger;
    protected rollbarLogger: Rollbar;

    protected router: Router;
    protected db: Database;
    protected s3: AwsS3;
    protected transporter: Transporter | undefined;


    protected constructor(live: boolean = false, port: string = '4000', hostname: string = '127.0.0.1') {
        if (live) dotenv.config();
        else dotenv.config();

        if (process.env['ENVIRONMENT']) console.info(`...::STARTING ${process.env['ENVIRONMENT']!} APPLICATION::...`);
        else process.exit(0);

        this.txtLogger = new SimpleTxtLogger(SimpleTxtLogger.newDateTime(), 'Server', 'Mencap-Website');
        this.rollbarLogger = new Rollbar(process.env['ROLLBAR_ACCESS_TOKEN']!, process.env['ROLLBAR_ENV']!, this.txtLogger);
        this.txtLogger.writeToLogFile(`...::STARTING ${process.env['ENVIRONMENT']!} APPLICATION::...`);

        this.db = new Database(process.env['DB_NAME']!, process.env['DB_HOST']!, process.env['DB_USERNAME']!, process.env['DB_PASSWORD']!, this.txtLogger);
        this.s3 = new AwsS3(process.env['AWS_REGION']!, process.env['AWS_ACCESS_KEY']!, process.env['AWS_SECRET_ACCESS_KEY']!, this.txtLogger);

        this.port = process.env['PORT'] || port;
        this.hostname = process.env['HOSTNAME'] || hostname;
        this.router = express.Router();
        this.app = express();
        this.serverConfig();

        this.server = new http.Server(this.app);
        this.txtLogger.writeToLogFile('Server Configured.');

        this.serverStart();
    }

    private serverConfig(): void {
        this.transporter = nodemailer.createTransport({
            service: process.env['EMAIL_SERVER']!,
            auth: {
                user: process.env['EMAIL_USERNAME']!,
                pass: process.env['EMAIL_PASSWORD']!//Use an app password if using Gmail
            }
        });

        const corsOptions: cors.CorsOptions = {
            origin: [ `${process.env['CORS_ORIGIN']!}` ]
        };
        this.app.use(cors(corsOptions));

        const sessionOptions: session.SessionOptions = {
            /*
            store: new FileStore(),//store some session data in a db/cache?
            */
            cookie: {
                maxAge: 24 * 60 * 60 * 1000,//24 hours,
                httpOnly: false
            },
            secret: process.env['SESSION_SECRET']!,
            saveUninitialized: false,
            resave: false
        };
        this.app.use(session(sessionOptions));

        this.app.use(express.json());
        this.app.use(express.urlencoded({extended: true}));
        this.app.use(express.static('public'));
        this.app.set('view engine', 'ejs');

        this.app.use("/", this.router);
    }

    private serverStart(): void {
        this.txtLogger.writeToLogFile(`Hostname Available (but not in use): ${this.hostname}`);
        this.server.listen(parseInt(this.port), () => this.txtLogger.writeToLogFile(`Server Listening on Port: ${parseInt(this.port)}`));
    }

    // Accessor needed for testing only. So property 'this.app' can remain private.
    public appAccessor(app = this.app): Express { return app; }
}