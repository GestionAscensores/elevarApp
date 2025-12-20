import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER || 'test',
        pass: process.env.SMTP_PASS || 'test',
    },
})

export async function sendMail({ to, subject, html, attachments, replyTo, fromName }: { to: string, subject: string, html: string, attachments?: any[], replyTo?: string, fromName?: string }) {
    try {
        // Construct From header
        // If fromName is provided, use it with the authenticated user email
        // Otherwise fall back to env var or default
        let from = process.env.SMTP_FROM || '"Elevar App" <billing@elevar.app>'

        if (fromName && process.env.SMTP_USER) {
            from = `"${fromName}" <${process.env.SMTP_USER}>`
        }

        const info = await transporter.sendMail({
            from,
            to,
            replyTo,
            subject,
            html,
            attachments
        })
        console.log("Message sent: %s", info.messageId);
        return { success: true, messageId: info.messageId }
    } catch (error: any) {
        console.error("Error sending email: ", error)
        return { success: false, error: error.message }
    }
}

/**
 * Envía un email con el código de verificación
 */
export async function sendVerificationEmail(to: string, code: string, name?: string) {
    const greeting = name ? `Hola ${name},` : 'Hola,'

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .code-box { 
                    background: #f4f4f4; 
                    padding: 20px; 
                    text-align: center; 
                    font-size: 32px; 
                    font-weight: bold; 
                    letter-spacing: 8px;
                    margin: 30px 0;
                    border-radius: 8px;
                }
                .footer { font-size: 12px; color: #666; margin-top: 30px; }
            </style>
        </head>
        <body>
            <div class="container">
                <h2>Verificación de Email - Elevar App</h2>
                <p>${greeting}</p>
                <p>Tu código de verificación es:</p>
                <div class="code-box">${code}</div>
                <p>Este código expira en <strong>15 minutos</strong>.</p>
                <p>Si no solicitaste este código, puedes ignorar este mensaje.</p>
                <div class="footer">
                    <p>--<br>Equipo Elevar App</p>
                </div>
            </div>
        </body>
        </html>
    `

    return sendMail({
        to,
        subject: 'Código de verificación - Elevar App',
        html
    })
}
