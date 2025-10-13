export function generatePasswordResetEmail(userData: {
  name: string;
  resetToken: string;
}) {
  const { name, resetToken } = userData;
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;

  const html = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Restablecer contraseña</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px !important;
              margin: 0 auto;
              padding: 20px;
              background-color: #f5f5f5;
            }
            .container {
              background-color: white;
              padding: 40px;
              border-radius: 8px;
              width: 600px;
              margin: 0 auto;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #0070f3;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .logo {
              font-size: 24px;
              font-weight: bold;
              color: #0070f3;
              margin-bottom: 10px;
            }
            .button {
              display: inline-block;
              background-color: #0070f3;
              color: white !important;
              text-decoration: none;
              padding: 12px 30px;
              border-radius: 6px;
              font-weight: bold;
              text-align: center;
              margin: 20px 0;
            }
            .warning {
              background-color: #fff3cd;
              border: 1px solid #ffeaa7;
              padding: 15px;
              border-radius: 6px;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              color: #666;
              font-size: 14px;
              border-top: 1px solid #eee;
              padding-top: 20px;
              margin-top: 30px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo"><img alt="logo mks" src="https://cdn.prod.website-files.com/660d7fca91383b16cdb39a16/660dbaeddcb1d77a21d49e0e_Logo.png" width="100"/></div>
              <p>Sistema de gestión</p>
            </div>
            
            <h1>Hola ${name},</h1>
            
            <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta.</p>
            
            <p>Si fuiste tú quien solicitó este cambio, haz clic en el siguiente botón para crear una nueva contraseña:</p>
            
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Restablecer contraseña</a>
            </div>
            
            <p>Si el botón no funciona, copia y pega la siguiente URL en tu navegador:</p>
            <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 4px; font-family: monospace;">
              ${resetUrl}
            </p>
            
            <div class="warning">
              <strong>Importante:</strong> Este enlace expirará en 1 hora por razones de seguridad.
            </div>
            
            <p><strong>¿No solicitaste este cambio?</strong></p>
            <p>Si no solicitaste restablecer tu contraseña, puedes ignorar este email. Tu contraseña actual seguirá siendo válida.</p>
            
            <div class="footer">
              <p>Este email fue enviado automáticamente, por favor no respondas a esta dirección.</p>
              <p>&copy; ${new Date().getFullYear()} Tu Plataforma. Todos los derechos reservados.</p>
            </div>
          </div>
        </body>
        </html>
  `;

  return {
    html,
    subject: "Restablece tu contraseña - Tu Plataforma",
  };
}
