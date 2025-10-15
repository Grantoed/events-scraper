import { google, sheets_v4 } from "googleapis";
import dotenv from "dotenv";
dotenv.config();

const CLIENT_EMAIL = process.env.CLIENT_EMAIL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

if (!CLIENT_EMAIL || !PRIVATE_KEY) {
  throw new Error(
    "Missing CLIENT_EMAIL or PRIVATE_KEY in environment variables"
  );
}

// === GOOGLE AUTH ===
async function getSheetsClient(): Promise<sheets_v4.Sheets> {
  const auth = new google.auth.JWT({
    email: CLIENT_EMAIL,
    key: PRIVATE_KEY,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return google.sheets({ version: "v4", auth });
}

export default getSheetsClient;
