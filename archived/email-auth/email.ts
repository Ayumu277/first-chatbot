import { Resend } from 'resend'

// Resend設定（ビルド時のエラーを避けるためフォールバック付き）
const resendApiKey = process.env.RESEND_API_KEY || 'fallback_key_for_build'
const resend = new Resend(resendApiKey)

// 認証メール送信
export async function sendVerificationEmail(
  email: string,
  name: string,
  token: string
) {
  // 実際のAPIキーがない場合はエラーを返す
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 'fallback_key_for_build') {
    console.error('❌ RESEND_API_KEY not configured')
    throw new Error('メール送信サービスが設定されていません')
  }

  const verificationUrl = `${process.env.NEXTAUTH_URL}/api/auth/verify-email?token=${token}`
  console.log('📧 Sending verification email:', {
    to: email,
    apiKey: process.env.RESEND_API_KEY?.substring(0, 10) + '...',
    verificationUrl: verificationUrl
  })

  try {
    const { data, error } = await resend.emails.send({
      from: 'Acme <onboarding@resend.dev>', // 修正：Resendのデフォルトドメインを使用
      to: [email],
      subject: '【Chatbot】メールアドレス認証のお願い',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1E90FF; text-align: center;">🤖 Chatbot アカウント認証</h2>

          <p>こんにちは、<strong>${name}</strong>様</p>

          <p>Chatbotにご登録いただき、ありがとうございます！</p>

          <p>以下のボタンをクリックして、メールアドレスの認証を完了してください：</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}"
               style="background-color: #1E90FF; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              ✅ メールアドレスを認証する
            </a>
          </div>

          <p>または、以下のリンクをブラウザにコピー&ペーストしてください：</p>
          <p style="background-color: #f5f5f5; padding: 10px; border-radius: 4px; word-break: break-all; font-size: 12px;">
            ${verificationUrl}
          </p>

          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            ⏰ このリンクは24時間で期限切れとなります。<br>
            🛡️ このメールに心当たりがない場合は、無視していただいて構いません。
          </p>

          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

          <p style="text-align: center; color: #999; font-size: 12px;">
            🚀 Chatbot Team<br>
            AI Powered Chat Application
          </p>
        </div>
      `
    })

    if (error) {
      console.error('❌ Resend API error:', error)
      throw new Error(`メール送信エラー: ${error.message}`)
    }

    console.log('✅ Verification email sent via Resend to:', email)
    console.log('📧 Email ID:', data?.id)
    return { success: true, data }
  } catch (error) {
    console.error('❌ Failed to send verification email:', error)
    throw error
  }
}

// テスト用のメール送信関数
export async function sendTestEmail(email: string) {
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 'fallback_key_for_build') {
    console.error('❌ RESEND_API_KEY not configured')
    throw new Error('メール送信サービスが設定されていません')
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'Acme <onboarding@resend.dev>', // 修正：Resendのデフォルトドメインを使用
      to: [email],
      subject: '【テスト】Chatbot メール送信テスト',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1E90FF; text-align: center;">🤖 Chatbot メール送信テスト</h2>
          <p>このメールは、メール送信機能のテストです。</p>
          <p>このメールを受信できた場合、メール送信機能は正常に動作しています。</p>
          <p>送信日時: ${new Date().toLocaleString('ja-JP')}</p>
        </div>
      `
    })

    if (error) {
      console.error('❌ Test email error:', error)
      return { success: false, error }
    }

    console.log('✅ Test email sent successfully')
    return { success: true, data }
  } catch (error) {
    console.error('❌ Test email failed:', error)
    return { success: false, error }
  }
}