import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true" || Number(process.env.SMTP_PORT) === 465, // Use explicit var or auto-detect based on port
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export const sendMail = async ({
    to,
    subject,
    html,
}: {
    to: string;
    subject: string;
    html: string;
}) => {
    try {
        const info = await transporter.sendMail({
            from: '"Compras DAEM" <system@daemlu.cl>', // Updated sender name
            to,
            subject,
            html,
        });
        console.log("Message sent: %s", info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error("Error sending email:", error);
        // Log environment variables checks (safe logs)
        console.log("SMTP Config Check:", {
            host: !!process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            user: !!process.env.SMTP_USER,
            pass: !!process.env.SMTP_PASS,
        });
        return { success: false, error };
    }
};
