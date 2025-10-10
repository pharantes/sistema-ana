export async function getServerSession() {
  // In smoke tests, simulate no session by default
  return null;
}
