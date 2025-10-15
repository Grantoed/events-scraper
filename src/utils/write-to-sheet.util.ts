import getSheetsClient from "./get-sheets-client.util";
import { SHEET_ID, SHEET_NAME } from "../constants/contants";
import { EventItem } from "../types/types";

// === WRITE TO GOOGLE SHEETS ===
async function writeToSheet(events: EventItem[]): Promise<void> {
  const sheets = await getSheetsClient();

  await sheets.spreadsheets.values.clear({
    spreadsheetId: SHEET_ID,
    range: SHEET_NAME,
  });

  const rows = [
    ["Event name", "Date", "Location", "Price", "Description", "Type", "Link"],
    ...events.map((e) => [
      e.name,
      e.date,
      e.location,
      e.price,
      e.description,
      e.type,
      e.url,
    ]),
  ];

  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: SHEET_NAME,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: rows },
  });

  console.log(`✅ Uploaded ${events.length} events to Google Sheets.`);
}

export default writeToSheet;
