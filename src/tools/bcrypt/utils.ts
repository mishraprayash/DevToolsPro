export async function generateBcryptHash(password: string, saltRounds: number = 10): Promise<{ success: true; data: string } | { success: false; error: string }> {
  try {
    const bcrypt = await import('bcryptjs');
    const salt = bcrypt.genSaltSync(saltRounds);
    const hash = bcrypt.hashSync(password, salt);
    return { success: true, data: hash };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to generate hash' };
  }
}

export async function compareBcryptHash(password: string, hash: string): Promise<{ success: true; data: boolean } | { success: false; error: string }> {
  try {
    const bcrypt = await import('bcryptjs');
    const match = bcrypt.compareSync(password, hash);
    return { success: true, data: match };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to compare hash' };
  }
}
