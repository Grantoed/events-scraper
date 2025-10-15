import { google, sheets_v4 } from "googleapis";
import fs from "fs/promises";

// === GOOGLE AUTH ===
async function getSheetsClient(): Promise<sheets_v4.Sheets> {
  const credentialsRaw = await fs.readFile("./credentials.json", "utf8");
  const credentials = JSON.parse(credentialsRaw);

  const auth = new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return google.sheets({ version: "v4", auth });
}

export default getSheetsClient;
