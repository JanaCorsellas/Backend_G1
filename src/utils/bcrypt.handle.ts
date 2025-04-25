import bcrypt from "bcryptjs";

/**
 * Encripta una contraseña utilizando bcrypt
 * @param pass - Contraseña en texto plano
 * @returns Contraseña encriptada
 */
const encrypt = async (pass: string): Promise<string> => {
  try {
    const salt = await bcrypt.genSalt(10); // 10 rondas de salting
    const passwordHash = await bcrypt.hash(pass, salt);
    return passwordHash;
  } catch (error) {
    console.error("Error encriptando contraseña:", error);
    throw new Error("Error al encriptar contraseña");
  }
};

/**
 * Verifica si una contraseña coincide con su hash
 * @param pass - Contraseña en texto plano a verificar
 * @param passHash - Hash de contraseña almacenado
 * @returns true si coincide, false si no coincide
 */
const verified = async (pass: string, passHash: string): Promise<boolean> => {
  try {
    const isCorrect = await bcrypt.compare(pass, passHash);
    return isCorrect;
  } catch (error) {
    console.error("Error verificando contraseña:", error);
    return false;
  }
};

export { encrypt, verified };