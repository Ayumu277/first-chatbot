import nodemailer from 'nodemailer'

// メール送信設定
const transporter = nodemailer.createTransporter({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER || 'ayumu.iimuro20@gmail.com',
    pass: process.env.EMAIL_PASSWORD || process.env.GMAIL_APP_PASSWORD
  }
})

// 認証メール送信
export async function sendVerificationEmail(
  email: string,
  name: string,
  token: string
) {
  const verificationUrl = `${process.env.NEXTAUTH_URL}/api/auth/verify-email?token=${token}`

  const mailOptions = {
    from: '"Chatbot" <ayumu.iimuro20@gmail.com>',
    to: email,
    subject: '【Chatbot】メールアドレス認証のお願い',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1E90FF; text-align: center;">Chatbot アカウント認証</h2>

        <p>こんにちは、${name}様</p>

        <p>Chatbotにご登録いただき、ありがとうございます。</p>

        <p>以下のボタンをクリックして、メールアドレスの認証を完了してください：</p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}"
             style="background-color: #1E90FF; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
            メールアドレスを認証する
          </a>
        </div>

        <p>または、以下のリンクをブラウザにコピー&ペーストしてください：</p>
        <p style="background-color: #f5f5f5; padding: 10px; border-radius: 4px; word-break: break-all;">
          ${verificationUrl}
        </p>

        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          ※このリンクは24時間で期限切れとなります。<br>
          ※このメールに心当たりがない場合は、無視していただいて構いません。
        </p>

        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

        <p style="text-align: center; color: #999; font-size: 12px;">
          Chatbot Team
        </p>
      </div>
    `
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log('✅ Verification email sent to:', email)
    return { success: true }
  } catch (error) {
    console.error('❌ Failed to send verification email:', error)
    return { success: false, error }
  }
}