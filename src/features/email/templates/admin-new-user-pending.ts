export function generateAdminNewUserPendingEmail(data: {
  newUserEmail: string;
  newUserName: string;
}) {
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/admin/users?status=pending`;

  const subject = "Nuevo usuario pendiente de aprobación";

  const html = `
  <div style="font-family: Arial, sans-serif; line-height:1.5;">
    <h2>Nuevo registro pendiente</h2>
    <p>Se registró un usuario y está esperando aprobación:</p>
    <ul>
      <li><strong>Nombre:</strong> ${data.newUserName}</li>
      <li><strong>Email:</strong> ${data.newUserEmail}</li>
    </ul>

    <p>Entrá al panel para asignarle institución y aprobarlo:</p>

    <p style="margin: 18px 0;">
      <a href="${url}"
         style="background:#0070f3;color:#fff;text-decoration:none;padding:12px 16px;border-radius:6px;">
        Ver pendientes
      </a>
    </p>

    <p style="font-size:12px;color:#666;">
      Este mail fue enviado automáticamente.
    </p>
  </div>`;

  return { subject, html };
}
