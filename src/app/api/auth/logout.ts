import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  // Eliminar cookie de autenticación
  res.setHeader("Set-Cookie", [
    "token=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict",
  ]);

  res.status(200).json({
    message: "Logout exitoso",
  });
}
