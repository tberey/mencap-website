import dotenv from 'dotenv';
import nodemailer from 'nodemailer';


dotenv.config();


const transporter = nodemailer.createTransport({
    service: process.env['EMAIL_SERVER'],
    auth: {
        user: process.env['EMAIL_USERNAME'],
        pass: process.env['EMAIL_PASSWORD']
    }
});


async function sendTokenReminder() {
    if (transporter) {
        try {
            await transporter.sendMail({
                from: process.env['EMAIL_ADDRESS'],
                to: process.env['MY_EMAIL'],
                cc: process.env['MY_MENCAP_EMAIL'],
                subject: '[Website Reminder] Rotate tokens',
                text: 'Hi,\n\nThis is an automatic reminder that access tokens need rotating for the Mencap website.\n\n'
            });
            console.log("Token reminder sent successfully.");
        } catch (error) {
            console.error("Error sending token reminder email:", error);
        }
    }
}

sendTokenReminder();
