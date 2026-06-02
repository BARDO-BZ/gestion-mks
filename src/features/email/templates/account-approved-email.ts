export function generateAccountApprovedEmail(userData: {
  name: string;
  email: string;
}) {
  const { name } = userData;
  const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL}/login`;

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Cuenta aprobada</title>
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
          margin: 0 auto;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #0070f3;
          padding-bottom: 20px;
          margin-bottom: 30px;
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
        .info {
          background-color: #f8f9fa;
          border-left: 4px solid #0070f3;
          padding: 15px;
          border-radius: 4px;
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
          <img alt="logo mks" src="https://cdn.prod.website-files.com/660d7fca91383b16cdb39a16/660dbaeddcb1d77a21d49e0e_Logo.png" width="100"/>
          <p>Sistema de gestión</p>
        </div>

        <h1 class="title">¡Hola, ${name}!</h1>

        <div class="content">
          <div class="info">
            <p><strong>Tu cuenta fue aprobada</strong> y ya está lista para usar.</p>
          </div>

          <p>Ya podés ingresar al sistema con tu email y contraseña.</p>

          <div style="text-align: center;">
            <a href="${loginUrl}" class="button">Iniciar sesión</a>
          </div>

          <p>Si tenés alguna pregunta o necesitás ayuda, no dudes en contactarnos.</p>
        </div>

        <div class="footer">
          <p>Este email fue enviado automáticamente, por favor no respondas a esta dirección.</p>
          <p>&copy; ${new Date().getFullYear()} SmartCheck</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const subject = "Tu cuenta fue aprobada ✅ Ya podés ingresar";

  return { html, subject };
}
