export function generateWelcomeEmail(userData: {
  name: string;
  email: string;
  activationToken?: string;
}) {
  const { name, activationToken } = userData;
  const activationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/activate?token=${activationToken}`;

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Bienvenido a nuestra plataforma</title>
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
          width: 600px;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          margin: 0 auto
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
        .title {
          color: #333;
          margin-bottom: 20px;
        }
        .content {
          margin-bottom: 30px;
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
        .button:hover {
          background-color: #0051cc;
        }
        .footer {
          text-align: center;
          color: #666;
          font-size: 14px;
          border-top: 1px solid #eee;
          padding-top: 20px;
          margin-top: 30px;
        }
        .warning {
          background-color: #fff3cd;
          border: 1px solid #ffeaa7;
          padding: 15px;
          border-radius: 6px;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo"><img alt="logo mks" src="https://cdn.prod.website-files.com/660d7fca91383b16cdb39a16/660dbaeddcb1d77a21d49e0e_Logo.png" width="100"/></div>
          <p>Sistema de gestión</p>
        </div>
        
        <h1 class="title">¡Bienvenido, ${name}!</h1>
        
        <div class="content">
          <p>Gracias por registrarte en nuestra plataforma.</p>
          
          ${
            activationToken
              ? `
            <p>Para completar tu registro y activar tu cuenta, por favor hacé clic en el siguiente botón:</p>
            
            <div style="text-align: center;">
              <a href="${activationUrl}" class="button">Activar mi cuenta</a>
            </div>
            
            <p>Si el botón no funciona, copia y pega la siguiente URL en tu navegador:</p>
            <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 4px; font-family: monospace;">
              ${activationUrl}
            </p>
            
            <div class="warning">
              <strong>Importante:</strong> Este enlace expirará en 24 horas por razones de seguridad.
            </div>
          `
              : `
            <p>Tu cuenta ha sido activada exitosamente y ya podés comenzar a usar todas las funcionalidades de la plataforma.</p>
            
            <div style="text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/login" class="button">Iniciar sesión</a>
            </div>
          `
          }
          
          <p>Si tenés alguna pregunta o necesitás ayuda, no dudes en contactarnos.</p>
        </div>
        
        <div class="footer">
          <p>Este email fue enviado automáticamente, por favor no respondas a esta dirección.</p>
          <p>&copy; ${new Date().getFullYear()} Tu Plataforma. Todos los derechos reservados.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const subject = activationToken
    ? "¡Bienvenido! Activa tu cuenta"
    : "¡Bienvenido a nuestra plataforma!";

  return { html, subject };
}
