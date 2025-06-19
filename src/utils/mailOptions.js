export function mailOptions(email, otp) {
  return {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Recuperação de senha - Adotaí",
    html: `
      <div style="
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        max-width: 600px;
        width: 90%;
        margin: 40px auto;
        padding: 0;
        border-radius: 12px;
        background: linear-gradient(to bottom, #0099DD, #005277);
        box-shadow: 0 4px 16px rgba(0,0,0,0.25);
        text-align: center;
      ">
        <div style="
          background-color: rgba(255, 255, 255, 0.95);
          border-radius: 12px;
          padding: 30px 20px;
          color: #333333;
        ">
          <h2 style="
            font-weight: 700;
            font-size: 28px;
            margin-bottom: 24px;
            color: #EA8420;
          ">
            🔑 Recuperação de senha - Adotaí
          </h2>
          <p style="font-size: 17px; line-height: 1.6; margin-bottom: 24px; color: #444444;">
            Olá,
          </p>
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 36px; color: #555555;">
            Você solicitou a recuperação da senha para sua conta no <strong>Adotaí</strong>. Use o código abaixo para redefinir sua senha. Este código é válido por <strong>10 minutos</strong>.
          </p>
          <div style="
            display: inline-block;
            background-color: #EA8420;
            color: #FFFFFF;
            font-family: 'Roboto Mono', monospace;
            font-size: 38px;
            font-weight: 700;
            letter-spacing: 9px;
            padding: 18px 48px;
            border-radius: 14px;
            user-select: all;
            box-shadow: 0 4px 16px rgba(234, 132, 32, 0.6);
            margin-bottom: 36px;
          ">
            ${otp}
          </div>
          <p style="font-size: 14px; color: #666666; margin-top: 0; line-height: 1.4;">
            Se você não solicitou essa alteração, por favor ignore este e-mail.
          </p>
          <p style="font-size: 14px; color: #666666; margin-top: 48px; font-weight: 600;">
            Atenciosamente,<br/>
            Equipe Adotaí
          </p>
        </div>
      </div>
    `,
  };
}
