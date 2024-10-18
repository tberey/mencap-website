import { ServerSetup } from './ServerSetup';
import { Helper } from './services/Helper';
import { queryArticlesRead, queryEventsRead, queryGalleryRead, queryUsersRead } from 'services/Database';
import { Request, Response } from 'express';
import formidable, { File } from 'formidable';
import Formidable from 'formidable/Formidable';
import axios from 'axios';


type CalendarEvent = {
    id: string,
    title: string,
    daysOfWeek: string,
    allDay: boolean,
    startTime: string,
    startRecur: string,
    endTime: string,
    endRecur: string,
    className: string,
} | {
    start: string,
    end: string
};

type S3Details = {
    articlesFolder: string,
    galleryFolder: string
}


export class Server extends ServerSetup {

    constructor(live?: boolean, port?: string, hostname?: string) {
        super(live, port, hostname);
        this.getRequests();
        this.postRequests();
    }


    private s3Details: S3Details = {
        articlesFolder: 'articles-media',
        galleryFolder: 'gallery-media',
    };


    private getRequests(): void {
        this.router.get('/', async (req: Request, res: Response): Promise<void> => {
            this.txtLogger.writeToLogFile('Request Made: GET /');

            let articlesPostsList: queryArticlesRead[] = [];
            let articlesMediaUrl: string = `https://${process.env['AWS_BUCKET_NAME']}.s3.${process.env['AWS_REGION']}.amazonaws.com/${this.s3Details.articlesFolder}/`;

            try {
                let facebookUrl: string = `https://graph.facebook.com/${process.env['FACEBOOK_PAGE_ID']}/posts?access_token=${process.env['FACEBOOK_APP_GRAPH_API_PAGE_TOKEN']}&fields=message,full_picture,created_time&limit=3`;
                let instagramUrl: string = `https://graph.instagram.com/${process.env['INSTAGRAM_BUSINESS_USER_ID']}/media?fields=caption,media_url,timestamp&access_token=${process.env['INSTAGRAM_APP_API_TOKEN']}&limit=3`;

                let articles: queryArticlesRead[] = await this.db.getArticles(3);
                if (articles) articles.forEach((article: queryArticlesRead) => article.body = article.body.replace(/\n/g, '<br>'));
                this.txtLogger.writeToLogFile('Successfully got Articles.');

                const responseFb = await fetch(facebookUrl);
                const dataFb = await responseFb.json();
                let fbPosts: queryArticlesRead[] =  await dataFb.data.map((postFb: { message: string; full_picture: string; created_time: string; }) => ({
                    ID: 0,
                    title: 'Facebook Post',
                    date: Helper.formatDate(postFb.created_time),
                    body: postFb.message,
                    file: null,
                    fileName: null,
                    imgThumb: null,
                    imgMain: postFb.full_picture,
                    author: 'fb',
                    userUid: '127345',
                    type: 'fb',
                    createdAt: postFb.created_time
                }));
                this.txtLogger.writeToLogFile('Successfully got Facebook Posts.');

                const responseIg = await fetch(instagramUrl);
                const dataIg = await responseIg.json();
                let igPosts: queryArticlesRead[] = await dataIg.data.map((postIg: { caption: string; media_url: string; timestamp: string; }) => ({
                    ID: 0,
                    title: 'Instagram Post',
                    date: Helper.formatDate(postIg.timestamp),
                    body: postIg.caption,
                    file: null,
                    fileName: null,
                    imgThumb: null,
                    imgMain: postIg.media_url,
                    author: 'ig',
                    userUid: '124345',
                    type: 'ig',
                    createdAt: postIg.timestamp
                }));
                this.txtLogger.writeToLogFile('Successfully got Instagram Posts.');

                articlesPostsList = articlesPostsList.concat(articles, fbPosts, igPosts);

                // Sort by date and take the first 8 items from this super list. TODO: Add pagination, (using 'paging.next' URL, as part of Meta APIs).
                if (articlesPostsList.length) {
                    articlesPostsList.sort((a, b) => Helper.parseDate(b.createdAt)! - Helper.parseDate(a.createdAt)!);
                    articlesPostsList = articlesPostsList.slice(0, 8);
                }

            } catch (err) {
                this.txtLogger.writeToLogFile(`An error occurred getting articles or posts: ${err}`);
            }
            finally {
                res.status(200);
                res.render('index.ejs', {
                    loggedIn: req.session.loggedin ? true : false,
                    username: req.session.username || '',
                    uid: req.session.uid || '',
                    mediaUrl: articlesMediaUrl || '',
                    articles: articlesPostsList || []
                });

                this.txtLogger.writeToLogFile(
                    `Request Completed:
                    POST: ${req.url},
                    Host: ${req.hostname},
                    IP: ${req.ip},
                    Type: ${req.protocol?.toUpperCase()},
                    Status: ${res.statusCode}.`
                );
            }
        });

        this.router.get('/login', async (req: Request, res: Response): Promise<void> => {
            this.txtLogger.writeToLogFile('Request Made: GET /login');

            if (req.session.loggedin) return res.status(302).redirect('/');

            res.status(200);
            res.render('login.ejs');

            this.txtLogger.writeToLogFile(
                `Request Completed:
                GET: ${req.url},
                Host: ${req.hostname},
                IP: ${req.ip},
                Type: ${req.protocol?.toUpperCase()},
                Status: ${res.statusCode}.`
            );
        });

        this.router.get('/account', async (req: Request, res: Response): Promise<void> => {
            this.txtLogger.writeToLogFile('Request Made: GET /account');

            if (!req.session.loggedin || !req.session.sid || !(await this.db.checkData(req.session.sid.toString(), 'sid'))) return res.status(401).redirect('/login');

            res.status(200);
            res.render('account.ejs', {
                loggedIn: req.session.loggedin ? true : false,
                username: req.session.username || '',
                email: await this.db.getData('email','sid', req.session.sid) || '',
                membership: await this.db.getData('membership','sid', req.session.sid) || ''
            });

            this.txtLogger.writeToLogFile(
                `Request Completed:
                GET: ${req.url},
                Host: ${req.hostname},
                IP: ${req.ip},
                Type: ${req.protocol?.toUpperCase()},
                Status: ${res.statusCode}.`
            );
        });

        this.router.get('/about', async (req: Request, res: Response): Promise<void> => {
            this.txtLogger.writeToLogFile('Request Made: GET /about');

            res.status(200);
            res.render('about.ejs', {
                loggedIn: req.session.loggedin ? true : false,
                username: req.session.username || ''
            });

            this.txtLogger.writeToLogFile(
                `Request Completed:
                GET: ${req.url},
                Host: ${req.hostname},
                IP: ${req.ip},
                Type: ${req.protocol?.toUpperCase()},
                Status: ${res.statusCode}.`
            );
        });

        this.router.get('/find', async (req: Request, res: Response): Promise<void> => {
            this.txtLogger.writeToLogFile('Request Made: GET /find');

            res.status(200);
            res.render('find.ejs', {
                loggedIn: req.session.loggedin ? true : false,
                username: req.session.username || ''
            });

            this.txtLogger.writeToLogFile(
                `Request Completed:
                GET: ${req.url},
                Host: ${req.hostname},
                IP: ${req.ip},
                Type: ${req.protocol?.toUpperCase()},
                Status: ${res.statusCode}.`
            );
        });

        this.router.get('/events', async (req: Request, res: Response): Promise<void> => {
            this.txtLogger.writeToLogFile('Request Made: GET /events');

            let events: queryEventsRead[] | null = null;
            let parsedEvents: CalendarEvent[] = [];

            try {
                events = await this.db.getEvents(250);
                this.txtLogger.writeToLogFile('Successfully got Events.');
                
                if (events) events.forEach((event: queryEventsRead) => {
                    if (event.recurring) parsedEvents.push({
                        title: event.title,
                        id: event.ID.toString(),
                        daysOfWeek: event.recurring,
                        allDay: event.allDay,
                        startTime: event.startDateTime.toTimeString(),
                        startRecur: event.startDateTime.toISOString(),
                        endTime: event.endDateTime.toTimeString(),
                        endRecur: event.endDateTime.toISOString(),
                        className: `${event.ID}_${event.userUid}`
                    });
                    else parsedEvents.push({
                        title: event.title,
                        id: event.ID.toString(),
                        allDay: event.allDay,
                        start: event.startDateTime.toISOString(),
                        end: event.endDateTime.toISOString(),
                        className: `${event.ID}_${event.userUid}`
                    });
                });

            } catch (err) {
                this.txtLogger.writeToLogFile(`An error occurred getting articles: ${err}`);

            } finally {
                res.status(200);
                res.render('events.ejs', {
                    loggedIn: req.session.loggedin ? true : false,
                    username: req.session.username || '',
                    uid: req.session.uid || '',
                    calendarEvents: JSON.stringify(parsedEvents) || '',
                    events: events || []
                });

                this.txtLogger.writeToLogFile(
                    `Request Completed:
                    POST: ${req.url},
                    Host: ${req.hostname},
                    IP: ${req.ip},
                    Type: ${req.protocol?.toUpperCase()},
                    Status: ${res.statusCode}.`
                );
            }
        });

        this.router.get('/gallery', async (req: Request, res: Response): Promise<void> => {
            this.txtLogger.writeToLogFile('Request Made: GET /gallery');

            let gallery: queryGalleryRead[] | undefined;
            let years: queryGalleryRead[] | undefined;
            let months: queryGalleryRead[] | undefined;
            let mediaUrl: string = `https://${process.env['AWS_BUCKET_NAME']}.s3.${process.env['AWS_REGION']}.amazonaws.com/${this.s3Details.galleryFolder}/`;
            const { yearView } = req.query;

            try {
                const mediaLimit: number = 420;
                years = await this.db.getGalleryYears();
                months = await this.db.getGalleryMonthsByYear((yearView) ? yearView.toString() : ((years && years[0] && years[0].year) ? years[0].year : '2023'));
                gallery = await this.db.getGalleryMediaByYear(mediaLimit, (yearView) ? yearView.toString() : ((years && years[0] && years[0].year) ? years[0].year : '2023'));
                this.txtLogger.writeToLogFile('Successfully got Gallery Media.');

                if (months) months.forEach((month) => {
                    if (Helper.getMonthName(month.month)) month.monthName = Helper.getMonthName(month.month)!
                });

            } catch (err) {
                this.txtLogger.writeToLogFile(`An error occurred getting Gallery media: ${err}`);
            }
            finally {
                res.status(200);
                res.render('gallery.ejs', {
                    loggedIn: req.session.loggedin ? true : false,
                    username: req.session.username || '',
                    uid: req.session.uid || '',
                    mediaUrl: mediaUrl || '',
                    gallery: gallery || [],
                    months: months || [],
                    years: years || []
                });

                this.txtLogger.writeToLogFile(
                    `Request Completed:
                    POST: ${req.url},
                    Host: ${req.hostname},
                    IP: ${req.ip},
                    Type: ${req.protocol?.toUpperCase()},
                    Status: ${res.statusCode}.`
                );
            }
        });

        this.router.get('/involve', async (req: Request, res: Response): Promise<void> => {
            this.txtLogger.writeToLogFile('Request Made: GET /involve');

            res.status(200);
            res.render('involve.ejs', {
                loggedIn: req.session.loggedin ? true : false,
                username: req.session.username || ''
            });

            this.txtLogger.writeToLogFile(
                `Request Completed:
                GET: ${req.url},
                Host: ${req.hostname},
                IP: ${req.ip},
                Type: ${req.protocol?.toUpperCase()},
                Status: ${res.statusCode}.`
            );
        });

        this.router.get('/cafe', async (req: Request, res: Response): Promise<void> => {
            this.txtLogger.writeToLogFile('Request Made: GET /cafe');

            res.status(200);
            res.render('cafe.ejs', {
                loggedIn: req.session.loggedin ? true : false,
                username: req.session.username || ''
            });

            this.txtLogger.writeToLogFile(
                `Request Completed:
                GET: ${req.url},
                Host: ${req.hostname},
                IP: ${req.ip},
                Type: ${req.protocol?.toUpperCase()},
                Status: ${res.statusCode}.`
            );
        });

        this.router.get('/contact', async (req: Request, res: Response): Promise<void> => {
            this.txtLogger.writeToLogFile('Request Made: GET /contact');

            res.status(200);
            res.render('contact.ejs', {
                loggedIn: req.session.loggedin ? true : false,
                username: req.session.username || '',
                honeyValue: process.env['HONEY_PUBLIC_VALUE'] || 'bac312'
            });

            this.txtLogger.writeToLogFile(
                `Request Completed:
                GET: ${req.url},
                Host: ${req.hostname},
                IP: ${req.ip},
                Type: ${req.protocol?.toUpperCase()},
                Status: ${res.statusCode}.`
            );
        });

        this.router.get('/donate', async (req:Request, res:Response): Promise<void> => {
            this.txtLogger.writeToLogFile('Request Made: GET /donate');

            res.status(200);
            res.render('donate.ejs', {
                loggedIn: req.session.loggedin ? true : false,
                username: req.session.username || ''
            });

            this.txtLogger.writeToLogFile(
                `Request Completed:
                GET: ${req.url},
                Host: ${req.hostname},
                IP: ${req.ip},
                Type: ${req.protocol?.toUpperCase()},
                Status: ${res.statusCode}.`
            );
        });

        this.router.get('/help', async (req:Request, res:Response): Promise<void> => {
            this.txtLogger.writeToLogFile('Request Made: GET /help');

            if (!req.session.loggedin || !req.session.sid || !(await this.db.checkData(req.session.sid.toString(), 'sid'))) return res.status(401).redirect('/login');

            res.status(200);
            res.render('help.ejs', {
                loggedIn: req.session.loggedin ? true : false,
                username: req.session.username || ''
            });

            this.txtLogger.writeToLogFile(
                `Request Completed:
                GET: ${req.url},
                Host: ${req.hostname},
                IP: ${req.ip},
                Type: ${req.protocol?.toUpperCase()},
                Status: ${res.statusCode}.`
            );
        });

        this.router.get('/outreach', async (req: Request, res: Response): Promise<void> => {
            this.txtLogger.writeToLogFile('Request Made: GET /outreach');
        
            // Redirect to the Google forms Members Referral form.
            res.redirect("https://docs.google.com/forms/d/e/1FAIpQLSeoPm-4CKMJ1BmsjcGd_cZvz7pWlb7E_w1MBirYyvhmQGMj6w/viewform?usp=sf_link");

            this.txtLogger.writeToLogFile(
                `Request Completed:
                GET: ${req.url},
                Host: ${req.hostname},
                IP: ${req.ip},
                Type: ${req.protocol?.toUpperCase()},
                Status: ${res.statusCode}.`
            );
        });

        this.router.get('/test', async (req:Request, res:Response): Promise<void> => {
            this.txtLogger.writeToLogFile('Request Made: GET /test');

            res.status(200);
            res.redirect('/');

            this.txtLogger.writeToLogFile(
                `Request Completed:
                GET: ${req.url},
                Host: ${req.hostname},
                IP: ${req.ip},
                Type: ${req.protocol?.toUpperCase()},
                Status: ${res.statusCode}.`
            );
        });
    }


    private postRequests(): void {
        this.router.post('/login', async (req: Request, res: Response): Promise<void> => {
            this.txtLogger.writeToLogFile('Request Made: POST /login');

            let log: string = '';
            let alertLog: boolean = false;
            let status: number = 418;

            req.session.loggedin = false;
            req.session.username = '';
            req.session.uid = '';
            req.session.sid = '';

            try {
                if (!req.session.loginRequests) req.session.loginRequests = 0;
                else if (req.session.loginRequests >= 3) {
                    this.txtLogger.writeToLogFile('Failed to reset account. Session limit reached.');
                    log = "Maximum account login attempts reached. Please check your email address and password are both correct. You can try again in 24 hours.";
                    alertLog = true;
                    status = 429;
                    return;
                }

                const { username, password } = req.body;

                if (!username.toString() || !password.toString()) {
                    log = 'Login failed. Enter your username and password.';
                    status = 400;
                    alertLog = true;
                    return;
                }

                req.session.loginRequests++;

                const dbResponse: null | queryUsersRead = await this.db.login(username.toString(), password.toString());

                if (dbResponse) {
                    req.session.loggedin = true;
                    req.session.username = dbResponse.username;
                    req.session.uid = dbResponse.uid;
                    req.session.sid = dbResponse.sid;
                    status = 200;
                    return;
                }

                log = 'Login failed. Incorrect username or password.';
                status = 401;
                alertLog = true;

            } catch (err) {
                log = `An error occurred during login: ${err}`;
                status = 500;
                alertLog = true;

            } finally {
                res.status(status);

                if (alertLog && log) {
                    const safeLog = encodeURIComponent(log);
                    res.send(`<script>alert("${decodeURIComponent(safeLog)}"); window.location.href = '/login';</script>`);
                }
                else res.redirect('/');

                if (log) this.txtLogger.writeToLogFile(log);

                this.txtLogger.writeToLogFile(
                    `Request Completed:
                    POST: ${req.url},
                    Host: ${req.hostname},
                    IP: ${req.ip},
                    Type: ${req.protocol?.toUpperCase()},
                    Status: ${res.statusCode}.`
                );
            }
        });

        this.router.post('/logout', async (req: Request, res: Response): Promise<void> => {
            this.txtLogger.writeToLogFile('Request Made: POST /logout');

            req.session.loggedin = false;
            req.session.username = '';
            req.session.uid = '';
            req.session.sid = '';

            res.status(200);
            res.redirect('/');

            this.txtLogger.writeToLogFile(
                `Request Completed:
                GET: ${req.url},
                Host: ${req.hostname},
                IP: ${req.ip},
                Type: ${req.protocol?.toUpperCase()},
                Status: ${res.statusCode}.`
            );
        });

        this.router.post('/reset', async (req: Request, res: Response): Promise<void> => {
            this.txtLogger.writeToLogFile('Request Made: POST /reset');

            let log: string = '';
            let alertLog: boolean = false;
            let status: number = 418;

            req.session.loggedin = false;
            req.session.username = '';
            req.session.uid = '';
            req.session.sid = '';

            try {
                if (!req.session.resetRequests) req.session.resetRequests = 0;
                else if (req.session.resetRequests >= 2) {
                    this.txtLogger.writeToLogFile('Failed to reset account. Session limit reached.');
                    log = "Maximum account reset attempts reached. Please check you inbox, including junk or spam mail, for an account reset email. If not, check your email address is correct. You can try again in 24 hours.";
                    alertLog = true;
                    status = 429;
                    return;
                }

                const { email } = req.body;

                if (!email.toString()) {
                    log = 'Account recovery failed. Enter your email.';
                    status = 400;
                    alertLog = true;
                    return;
                }

                req.session.resetRequests++;

                const emailFound: boolean = await this.db.checkData(email.toString(), 'email');

                if (emailFound) {
                    const username: string | null = await this.db.getData('username','email', email.toString());

                    if(username) {
                        const newRandomPassword: string = Helper.generateRandomPassword(12);
                        const updateSuccess: boolean = await this.db.updateData(newRandomPassword, 'password', 'email', email.toString());

                        if (updateSuccess) {
                            if (this.transporter) this.transporter.sendMail({
                                from: process.env['EMAIL_ADDRESS'],
                                to: email.toString(),
                                subject: 'Mencap Website Account Recovery',
                                text:
                                    'Hi,\n\n'
                                    +'You are receiving this email because you have forgotten your Mencap website login details.\n'
                                    +'Your password has been reset, and you can find both your Username and Password below:\n\n'
                                    +`Your Username:  '${username}'\nYour new Password:  '${newRandomPassword}'.\n\n`
                                    +'You can login here: https://www.mencapliverpool.org.uk/login\n\n\n\n'
                                    +`If you did not do this, or were not expecting this email, you can reply to this email or contact: ${process.env['EMAIL_ADDRESS']}\n`
                            }, (err, info) => {
                                if (err) {
                                    this.txtLogger.writeToLogFile(`Error sending account recovery email: ${err}`);
                                } else {
                                    this.txtLogger.writeToLogFile(`Account recovery email sent: ${info.response}`);
                                }
                            });

                            status = 200;
                            return;
                        }
                    }

                    log = 'Account recovery failed. Database failed to update or get data.';
                    status = 500;
                    return;
                }

                log = 'Account recovery failed. Incorrect email address.';
                status = 200; // Send positive response so not to indicate it could be an incorrect credential.

            } catch (err) {
                log = `An error occurred during account recovery: ${err}`;
                status = 200; // Send positive response so not to indicate it could be an incorrect credential.

            } finally {
                res.status(status);

                if (alertLog && log) {
                    const safeLog = encodeURIComponent(log);
                    res.send(`<script>alert("${decodeURIComponent(safeLog)}"); window.location.href = '/login';</script>`);
                }
                else res.redirect('/');

                if (log) this.txtLogger.writeToLogFile(log);
                this.txtLogger.writeToLogFile(
                    `Request Completed:
                    POST: ${req.url},
                    Host: ${req.hostname},
                    IP: ${req.ip},
                    Type: ${req.protocol?.toUpperCase()},
                    Status: ${res.statusCode}.`
                );
            }
        });

        this.router.post('/account', async (req: Request, res: Response): Promise<void> => {
            this.txtLogger.writeToLogFile('Request Made: POST /account');

            if (!(await this.isValidUserSession(req))) return res.status(401).redirect('/login');

            let status: number = 418;
            let log: string = '';
            let alertLog: boolean = false;

            try {
                const { newUsername, newPassword, newEmail } = req.body;

                if (!newUsername.toString() && !newPassword.toString() && !newEmail.toString()) {
                    log = 'Account update failed. Enter either a new username, password or email.';
                    status = 400;
                    alertLog = true;
                    return;
                }

                if (req.session.sid) {
                    const sid: string | null = req.session.sid.toString();
                    const email: string | null = await this.db.getData('email','sid', sid);

                    if (email && (await this.db.updateAccount(email, newUsername.toString(), newPassword.toString(), newEmail.toString()))) {
                        if (newUsername.toString()) req.session.username = newUsername.toString();

                        if (this.transporter) this.transporter.sendMail({
                            from: process.env['EMAIL_ADDRESS'],
                            to: email,
                            subject: 'Mencap Website Account Updated',
                            text:
                                'Hi,\n\n'
                                +'You are receiving this email because you have updated your Mencap website account.\n'
                                +'Your account has successfully been updated, and you can check which details were updated below:\n\n'
                                +`${(newUsername.toString()) ? '    - Username\n': ''}`
                                +`${(newPassword.toString()) ? '    - Password\n': ''}`
                                +`${(newEmail.toString()) ? '    - Email\n': ''}`
                                +`\n\n\nIf you did not make any of these changes, or were not expecting this email, you can reply to this email or contact: ${process.env['EMAIL_ADDRESS']}\n`
                        }, (err, info) => {
                            if (err) {
                                this.txtLogger.writeToLogFile(`Error sending account update email: ${err}`);
                            } else {
                                this.txtLogger.writeToLogFile(`Account update email sent: ${info.response}`);
                            }
                        });

                        status = 200;
                        return;
                    }

                    log = 'Account update failed. Failed to update the user account.';
                    status = 400;
                    return;
                }

                log = 'Account update failed. Missing cache session data.';
                status = 401;

            } catch (err) {
                log = `An error occurred during account recovery: ${err}`;
                status = 500;

            } finally {
                res.status(status);

                if (alertLog && log) {
                    const safeLog = encodeURIComponent(log);
                    res.send(`<script>alert("${decodeURIComponent(safeLog)}"); window.location.href = '/login';</script>`);
                }
                else res.redirect('/');

                if (log) this.txtLogger.writeToLogFile(log);
                this.txtLogger.writeToLogFile(
                    `Request Completed:
                    POST: ${req.url},
                    Host: ${req.hostname},
                    IP: ${req.ip},
                    Type: ${req.protocol?.toUpperCase()},
                    Status: ${res.statusCode}.`
                );
            }
        });

        this.router.post('/article', async (req: Request, res: Response): Promise<void> => {
            this.txtLogger.writeToLogFile('Request Made: POST /article');

            if (!(await this.isValidUserSession(req))) return res.status(401).redirect('/login');

            let status: number = 418;
            let log: string = '';

            try {
                const form: Formidable = formidable({  allowEmptyFiles: true, minFileSize: 0  });
                await new Promise<void>((resolve, reject) => {
                    form.parse(req, async (err, fields, files) => {
                        if (err) {
                            reject(err);
                            throw err;
                        }

                        const title: string | undefined = fields['title']![0];
                        const date: string | undefined = fields['date']![0];
                        const body: string | undefined = fields['body']![0];
                        const author: string | undefined = req.session.username;
                        const uid: string | undefined = req.session.uid;

                        if (!title || !date || !body || !author || !uid) {
                            log = 'Posting Article Failed. Please make sure you are logged in, and have provided at least a title, date and body for the post.';
                            status = 400;
                            return reject();
                        }

                        const imgThumb: File | undefined = files['imgThumb']![0];
                        const imgMain: File | undefined = files['imgMain']![0];
                        const fileDl: File | undefined = files['fileDl']![0];
                        const prefixNumber: number = Math.ceil(((Math.random() + 1) * (Math.random() + 1) * (new Date().getTime())) / 100000);

                        if (imgThumb && imgThumb.size > 1 && imgThumb.originalFilename) await this.s3.uploadFile(imgThumb.filepath, process.env['AWS_BUCKET_NAME']!, this.s3Details.articlesFolder, `${prefixNumber+1}_${imgThumb.originalFilename}`);
                        if (imgMain && imgMain.size > 1 && imgMain.originalFilename) await this.s3.uploadFile(imgMain.filepath, process.env['AWS_BUCKET_NAME']!, this.s3Details.articlesFolder, `${prefixNumber+2}_${imgMain.originalFilename}`);
                        if (fileDl && fileDl.size > 1 && fileDl.originalFilename) await this.s3.uploadFile(fileDl.filepath, process.env['AWS_BUCKET_NAME']!, this.s3Details.articlesFolder, `${prefixNumber+3}_${fileDl.originalFilename}`);

                        const dbResponse: boolean = await this.db.createArticle(
                            title, date, body, author, uid,
                            (imgThumb && imgThumb.size > 1 && imgThumb.originalFilename) ? `${prefixNumber+1}_${imgThumb.originalFilename}` : undefined,
                            (imgMain && imgMain.size > 1 && imgMain.originalFilename) ? `${prefixNumber+2}_${imgMain.originalFilename}` : undefined,
                            (fileDl && fileDl.size > 1 && fileDl.originalFilename) ? `${prefixNumber+3}_${fileDl.originalFilename}` : undefined,
                            (fileDl && fileDl.size > 1 && fileDl.originalFilename) ? fileDl.originalFilename : undefined,
                        );

                        if (dbResponse) {
                            log = 'Successfully Posted Article. Your article will be added to the home page.';
                            status = 200;
                            return resolve();
                        }

                        log = 'Posting Article Failed. Something went wrong, contact the site admin for support.';
                        status = 500;
                        reject();
                    });
                });

            } catch (err) {
                log = `An error occurred during article posting: ${err}`;
                status = 500;

            } finally {
                res.status(status);

                if (status == 401) res.redirect('/login');
                else {
                    const safeLog = encodeURIComponent(log);
                    res.send(`<script>alert("${decodeURIComponent(safeLog)}"); window.location.href = '/';</script>`);
                }

                if (log) this.txtLogger.writeToLogFile(log);
                this.txtLogger.writeToLogFile(
                    `Request Completed:
                    POST: ${req.url},
                    Host: ${req.hostname},
                    IP: ${req.ip},
                    Type: ${req.protocol?.toUpperCase()},
                    Status: ${res.statusCode}.`
                );
            }
        });

        this.router.post('/article-delete', async (req: Request, res: Response): Promise<void> => {
            this.txtLogger.writeToLogFile('Request Made: POST /article-delete');

            if (!(await this.isValidUserSession(req))) return res.status(401).redirect('/login');

            let status: number = 418;
            let log: string = '';

            try {
                const uid: string | undefined = req.session.uid;
                const { articleId, userUid, files } = req.body;

                if (!uid || !articleId.toString() || !userUid.toString() || (uid != userUid.toString()) || !(await this.db.checkData(userUid.toString(), 'uid'))) {
                    log = 'Deleting Article Failed. Please make sure you are logged in, and deleting your own article.';
                    status = 400;
                    return;
                }

                const dbResponse: boolean = await this.db.deleteArticle(articleId.toString(), uid);

                if (dbResponse) {
                    if (files) files.forEach(async (file: string) => {
                        await this.s3.deleteFile(process.env['AWS_BUCKET_NAME']!, this.s3Details.articlesFolder, file);
                    });

                    log = 'Successfully Deleted Article. Your article will be removed from the home page.';
                    status = 200;
                    return;
                }

                log = 'Deleting Article Failed. Something went wrong, contact the site admin for support.';
                status = 500;

            } catch (err) {
                log = `An error occurred during article deleting: ${err}`;
                status = 500;

            } finally {
                res.status(status);

                if (status == 401) res.redirect('/login');
                else res.json({ log: log, redirect: '/' });

                if (log) this.txtLogger.writeToLogFile(log);
                this.txtLogger.writeToLogFile(
                    `Request Completed:
                    POST: ${req.url},
                    Host: ${req.hostname},
                    IP: ${req.ip},
                    Type: ${req.protocol?.toUpperCase()},
                    Status: ${res.statusCode}.`
                );
            }
        });

        this.router.post('/event', async (req: Request, res: Response): Promise<void> => {
            this.txtLogger.writeToLogFile('Request Made: POST /event');

            if (!(await this.isValidUserSession(req))) return res.status(401).redirect('/login');

            let log: string = '';
            let status: number = 418;
            let startDateTime: string;
            let endDateTime: string;

            try {
                let { startTime, endTime, recurring, allDay } = req.body;
                const { title, startDate, endDate } = req.body;
                const author: string | undefined = req.session.username;
                const uid: string | undefined = req.session.uid;

                if (!recurring) recurring = '';
                else recurring = `[${recurring}]`;

                if (allDay && recurring) {
                    startTime = "09:00";
                    endTime = "17:00";
                    allDay = false;
                } else if (allDay) {
                    startTime = "00:30";
                    endTime = "23:30";
                    allDay = true;
                } else allDay = false;

                startDateTime = `${startDate} ${startTime}`;
                endDateTime = `${endDate} ${endTime}`;

                if (!title.toString() || !startDate.toString() || !startTime.toString() || !startDateTime || !endDate.toString() || !endTime.toString() || !endDateTime || !author || !uid) {
                    log = 'Create Event Failed. Please make sure that you are logged in, and have also provided at least a title, date and duration for your event.';
                    status = 400;
                    return;
                }

                const dbResponse: boolean = await this.db.createEvent(title.toString(), startDateTime, endDateTime, recurring, allDay, author, uid);

                log = 'Successfully Created a New Event. Your event will be added to the Calendar.';
                if (dbResponse) {
                    status = 200;
                    return;
                }

                log = 'Creating Event Failed. Something went wrong, contact the site admin for support.';
                status = 500;

            } catch (err) {
                log = `An error occurred during event creating: ${err}`;
                status = 500;

            } finally {
                res.status(status);
                const safeLog = encodeURIComponent(log);
                res.send(`<script>alert("${decodeURIComponent(safeLog)}"); window.location.href = '/events';</script>`);

                if (log) this.txtLogger.writeToLogFile(log);
                this.txtLogger.writeToLogFile(
                    `Request Completed:
                    POST: ${req.url},
                    Host: ${req.hostname},
                    IP: ${req.ip},
                    Type: ${req.protocol?.toUpperCase()},
                    Status: ${res.statusCode}.`
                );
            }
        });

        this.router.post('/event-delete', async (req: Request, res: Response): Promise<void> => {
            this.txtLogger.writeToLogFile('Request Made: POST /event-delete');

            if (!(await this.isValidUserSession(req))) return res.status(401).redirect('/login');

            let status: number = 418;
            let log: string = '';

            try {
                const uid: string | undefined = req.session.uid;
                const { eventId, userUid } = req.body;

                if (!uid || !eventId.toString() || !userUid.toString() || (uid != userUid.toString()) || !(await this.db.checkData(userUid.toString(), 'uid'))) {
                    log = 'Deleting Event Failed. Please make sure you are logged in, and deleting your own event.';
                    status = 400;
                    return;
                }

                const dbResponse: boolean = await this.db.deleteEvent(eventId.toString(), uid);

                if (dbResponse) {
                    log = 'Successfully Deleted Event. Your event will be removed from the calendar.';
                    status = 200;
                    return;
                }

                log = 'Deleting Event Failed. Something went wrong, contact the site admin for support.';
                status = 500;

            } catch (err) {
                log = `An error occurred during event deleting: ${err}`;
                status = 500;

            } finally {
                res.status(status);

                if (status == 401) res.redirect('/login');
                else res.json({ log: log, redirect: '/events' });

                if (log) this.txtLogger.writeToLogFile(log);
                this.txtLogger.writeToLogFile(
                    `Request Completed:
                    POST: ${req.url},
                    Host: ${req.hostname},
                    IP: ${req.ip},
                    Type: ${req.protocol?.toUpperCase()},
                    Status: ${res.statusCode}.`
                );
            }
        });

        this.router.post('/gallery', async (req: Request, res: Response): Promise<void> => {
            this.txtLogger.writeToLogFile('Request Made: POST /gallery');

            if (!(await this.isValidUserSession(req))) return res.status(401).redirect('/login');

            let log: string = '';
            let status: number = 418;

            try {
                const form: Formidable = formidable({  allowEmptyFiles: true, minFileSize: 0  });
                await new Promise<void>((resolve, reject): void => {
                    form.parse(req, async (err, fields, files) => {
                        if (err) {
                            reject(err);
                            throw err;
                        }
                        const month: string | undefined = fields['month']![0];
                        const year: string | undefined = fields['year']![0];
                        const galleryImage: File | undefined = files['galleryImg']![0];
                        const author: string | undefined = req.session.username;
                        const uid: string | undefined = req.session.uid;

                        if (!month || !year || !galleryImage || !author || !uid) {
                            log = 'Posting Failed. Please make sure you are logged in, and have provided a file, month and year for your image or video.';
                            status = 400;
                            return reject();
                        }

                        const prefixNumber: number = Math.ceil(((Math.random() + 1) * (Math.random() + 1) * (new Date().getTime())) / 100000);

                        if (galleryImage && galleryImage.size > 1) await this.s3.uploadFile(galleryImage.filepath, process.env['AWS_BUCKET_NAME']!, this.s3Details.galleryFolder, `${prefixNumber}_${galleryImage.originalFilename}`);

                        const dbResponse: boolean = await this.db.createGalleryMedia(month, year, author, uid, `${prefixNumber}_${galleryImage.originalFilename}`);

                        if (dbResponse) {
                            log = `Successfully Uploaded Media. Your image or video will be added to the gallery, under the month '${month}' and year '${year}'.`;
                            status = 200;
                            return resolve();
                        }

                        log = 'Uploading Media Failed. Something went wrong, contact the site admin for support.';
                        status = 500;

                        reject();
                    });
                });

            } catch (err) {
                log = `An error occurred during media uploading: ${err}`;
                status = 500;

            } finally {
                res.status(status);
                const safeLog = encodeURIComponent(log);
                res.send(`<script>alert("${decodeURIComponent(safeLog)}"); window.location.href = '/gallery';</script>`);

                if (log) this.txtLogger.writeToLogFile(log);
                this.txtLogger.writeToLogFile(
                    `Request Completed:
                    POST: ${req.url},
                    Host: ${req.hostname},
                    IP: ${req.ip},
                    Type: ${req.protocol?.toUpperCase()},
                    Status: ${res.statusCode}.`
                );
            }
        });

        this.router.post('/gallery-delete', async (req: Request, res: Response): Promise<void> => {
            this.txtLogger.writeToLogFile('Request Made: POST /gallery-delete');

            if (!(await this.isValidUserSession(req))) return res.status(401).redirect('/login');

            let status: number = 418;
            let log: string = '';

            try {
                const uid: string | undefined = req.session.uid;
                const { galleryId, userUid, files } = req.body;

                if (!uid || !galleryId.toString() || !files || !userUid.toString() || (uid != userUid.toString()) || !(await this.db.checkData(userUid.toString(), 'uid'))) {
                    log = 'Deleting Gallery Media Failed. Please make sure you are logged in, and deleting your own media.';
                    status = 400;
                    return;
                }

                const dbResponse: boolean = await this.db.deleteGalleryMedia(galleryId.toString(), uid);

                if (dbResponse) {
                    if (files) files.forEach(async (file: string) => {
                        await this.s3.deleteFile(process.env['AWS_BUCKET_NAME']!, this.s3Details.galleryFolder, file);
                    });

                    log = 'Successfully Deleted Media. Your image will be removed from the Gallery.';
                    status = 200;
                    return;
                }

                log = 'Deleting Media Failed. Something went wrong, contact the site admin for support.';
                status = 500;

            } catch (err) {
                log = `An error occurred during media deleting: ${err}`;
                status = 500;

            } finally {
                res.status(status);

                if (status == 401) res.redirect('/login');
                else res.json({ log: log, redirect: '/gallery' });

                if (log) this.txtLogger.writeToLogFile(log);
                this.txtLogger.writeToLogFile(
                    `Request Completed:
                    POST: ${req.url},
                    Host: ${req.hostname},
                    IP: ${req.ip},
                    Type: ${req.protocol?.toUpperCase()},
                    Status: ${res.statusCode}.`
                );
            }
        });

        this.router.post('/contact', async (req: Request, res: Response): Promise<void> => {
            this.txtLogger.writeToLogFile('Request Made: POST /contact');

            let status: number = 418;
            let log: string = '';
            let alertLog: boolean = false;

            try {
                if (!req.session.helpRequests) req.session.helpRequests = 0;
                else if (req.session.helpRequests >= 2) {
                    this.txtLogger.writeToLogFile('Failed to send message. Session limit reached.');
                    log = "Maximum messages sent in to us. You can't send too many messages in a short space of time, to allow us the time to respond and not get overwhelmed. Please try again in 24 hours.";
                    alertLog = true;
                    status = 429;
                    return;
                }

                const { name, email, message, contactTime, important, formLoadTime, 'g-recaptcha-response': recaptchaResponse } = req.body;

                if (contactTime || !important ||important != process.env['HONEY_PUBLIC_VALUE']) {
                    req.session.helpRequests++;
                    log = 'Did not send message. Hidden field has been completed.';
                    status = 200; // Don't tell malicious user it was a failed attempt.
                    return;
                }

                if (!name || !email || !message || !formLoadTime || !recaptchaResponse) {
                    log = 'Failed to send message. Make sure you have completed all fields on the form.';
                    status = 400;
                    alertLog = true;
                    return;
                }

                const isValidEmail = await this.validateEmail(email);

                if (!isValidEmail) {
                    log = 'Failed to send message. Make sure you have given a valid email address.';
                    status = 400;
                    alertLog = true;
                    return;
                }

                const isBadMessage = await this.containsBadWords([name, email, message], JSON.parse(process.env['BAD_WORDS']!));

                if (isBadMessage) {
                    req.session.helpRequests++;
                    log = 'Message Not Sent. We found some bad words when scanning your message.';
                    status = 400;
                    alertLog = true;
                    return;
                }

                const submissionThreshold = parseInt(process.env['SUBMISSION_THRESHOLD_TIME']!); // X seconds is at least required before form is submit successfully, which is set here.
                const formSubmitTime = new Date().getTime();
                const timeDifference = formSubmitTime - parseInt(formLoadTime);

                if (timeDifference < submissionThreshold) {
                    req.session.helpRequests++;
                    log = 'Did not send message. Form submitted in less time than the threshold.';
                    status = 200; // Don't tell malicious user it was a failed attempt.
                    return;
                }

                const recaptchaVerificationUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${process.env['RECAPTCHA_SECRET_KEY']}&response=${recaptchaResponse}`;
                const recaptchaServerResponse = await axios.post(recaptchaVerificationUrl);

                if (!recaptchaServerResponse.data.success) {
                    req.session.helpRequests++;
                    log = 'Failed to send message. reCAPTCHA verification failed.';
                    status = 400;
                    return;
                }

                if (this.transporter) {
                    try {
                        const info = await this.transporter.sendMail({
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
                        });

                        req.session.helpRequests++;
                        this.txtLogger.writeToLogFile(`Contact us email sent: ${info.response}`);
                        log = 'Message successfully sent.';
                        status = 200;

                    } catch (err) {
                        this.txtLogger.writeToLogFile(`Error sending account update email: ${err}`);
                        log = `Failed to send message. You can reach out to the site Admin here: ${process.env['EMAIL_ADDRESS']}`;
                        alertLog = true;
                        status = 500;
                    }
                }
            } catch (err) {
                log = `An error occurred during contact us request: ${err}`;
                status = 500;

            } finally {
                res.status(status);

                if (alertLog && log) {
                    const safeLog = encodeURIComponent(log);
                    res.send(`<script>alert("${decodeURIComponent(safeLog)}"); window.location.href = '/';</script>`);
                } else res.send(`<script>alert("Message successfully sent."); window.location.href = '/';</script>`);

                if (log) this.txtLogger.writeToLogFile(log);
                this.txtLogger.writeToLogFile(
                    `Request Completed:
                    POST: ${req.url},
                    Host: ${req.hostname},
                    IP: ${req.ip},
                    Type: ${req.protocol?.toUpperCase()},
                    Status: ${res.statusCode}.`
                );
            }
        });
    }


    private async isValidUserSession(req: Request): Promise<boolean> {
        if (
            req.session.loggedin
            &&
            req.session.uid
            &&
            await this.db.checkData(req.session.uid.toString(), 'uid')
            &&
            req.session.sid
            &&
            await this.db.checkData(req.session.sid.toString(), 'sid')
            &&
            req.session.username
            &&
            await this.db.checkData(req.session.username.toString(), 'username')
            &&
            await this.db.crossCheckData(req.session.sid.toString(), 'sid', req.session.uid.toString(), 'uid')
            &&
            await this.db.crossCheckData(req.session.sid.toString(), 'sid', req.session.username.toString(), 'username')
        ) return true;
        else {
            req.session.loggedin = false;
            req.session.username = '';
            req.session.uid = '';
            req.session.sid = '';

            return false;
        }
    }


    private async validateEmail(email: string): Promise<boolean> {
        // Check if email is a string and its length is less than 75 characters
        if (typeof email !== 'string' || email.length >= 75)  return false;

        // Split the email at the "@" symbol
        const parts = email.split('@');

        // Check if there's exactly one "@" symbol and both parts exist
        if (parts.length !== 2 || !parts[0] || !parts[1])  return false;

        // Check if the part after the "@" symbol contains at least one "."
        if (!parts[1].includes('.')) return false;

        // Regex pattern for basic email validation
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        // Test the email string against the regex pattern
        return emailPattern.test(email);
    }


    private async containsBadWords(strings: string[], badWords: string[]): Promise<boolean> {
        // Convert bad words to a Set for faster lookup
        const badWordsSet = new Set(badWords.map(word => word.toLowerCase()));

        // Function to check if a string contains any bad words
        const hasBadWord = (str: string, badWordsSet: Set<string>): boolean => {
            const lowerCaseStr = str.toLowerCase();

            // Convert Set to array and iterate over it
            for (let word of Array.from(badWordsSet)) {
                if (lowerCaseStr.includes(word)) return true;
            }

            return false;
        }

        // Check each string in the array
        for (let string of strings) {
            if (hasBadWord(string, badWordsSet)) return true;
        }

        return false;
    }
}