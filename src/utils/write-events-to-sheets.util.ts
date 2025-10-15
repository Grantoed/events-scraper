import getSheetsClient from "./get-sheets-client.util";
import { SHEET_ID } from "../constants/contants";
import scrapeEvents from "./scrape-events.util";
import { sheets_v4 } from "googleapis";

// === HELPERS ===
const monthsUkr = [
  "січня",
  "лютого",
  "березня",
  "квітня",
  "травня",
  "червня",
  "липня",
  "серпня",
  "вересня",
  "жовтня",
  "листопада",
  "грудня",
];

function getMonthName(dateStr: string) {
  for (const month of monthsUkr) {
    if (dateStr.includes(month)) return month;
  }
  return "Невідомий";
}

// Helper to get sheetId from sheet name
async function getSheetId(
  sheets: sheets_v4.Sheets,
  spreadsheetId: string,
  sheetName: string
) {
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const sheet = meta.data.sheets?.find(
    (s) => s.properties?.title === sheetName
  );
  if (!sheet || sheet.properties?.sheetId == null)
    throw new Error(`Sheet "${sheetName}" not found`);
  return sheet.properties.sheetId;
}

// === WRITE EVENTS TO SHEETS ===
async function writeEventsToSheets(
  events: Awaited<ReturnType<typeof scrapeEvents>>
) {
  const sheets = await getSheetsClient();

  // Group events by month
  const eventsByMonth: Record<string, typeof events> = {};
  for (const e of events) {
    const month = getMonthName(e.date);
    if (!eventsByMonth[month]) eventsByMonth[month] = [];
    eventsByMonth[month].push(e);
  }

  for (const month of Object.keys(eventsByMonth)) {
    const sheetName = month;

    let sheetId: number;

    // Try to get sheetId; if sheet doesn't exist, create it with header
    try {
      sheetId = await getSheetId(sheets, SHEET_ID, sheetName);
    } catch {
      const addRes = await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SHEET_ID,
        requestBody: {
          requests: [{ addSheet: { properties: { title: sheetName } } }],
        },
      });
      sheetId = addRes.data.replies?.[0].addSheet?.properties?.sheetId!;
      // Add header row
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${sheetName}!A1:G1`,
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [
            [
              "Назва події",
              "Дата",
              "Локація",
              "Ціна",
              "Опис",
              "Тип",
              "Посилання",
            ],
          ],
        },
      });
    }

    // Clear previous green highlights
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: {
        requests: [
          {
            repeatCell: {
              range: {
                sheetId,
                startRowIndex: 1, // skip header
                endRowIndex: 1000, // adjust if needed
                startColumnIndex: 0,
                endColumnIndex: 7,
              },
              cell: {
                userEnteredFormat: { backgroundColor: null },
              },
              fields: "userEnteredFormat.backgroundColor",
            },
          },
        ],
      },
    });

    // Get existing rows
    const existing = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${sheetName}!A2:G`,
    });

    const existingUrls = new Set(
      existing.data.values?.map((row) => row[6]) || []
    );

    // Filter new events that aren't already in the sheet
    const newEvents = eventsByMonth[month].filter(
      (e) => !existingUrls.has(e.url)
    );

    if (newEvents.length === 0) continue; // nothing to add

    const rows = newEvents.map((e) => [
      e.name,
      e.date,
      e.location,
      e.price,
      e.description,
      e.type,
      e.url,
    ]);

    // Append new events at the end
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: `${sheetName}!A:G`,
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: rows },
    });

    // Highlight newly added rows in green
    const startRow = (existing.data.values?.length || 0) + 2; // +2 because header is row 1
    const endRow = startRow + newEvents.length - 1;

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: {
        requests: [
          {
            repeatCell: {
              range: {
                sheetId,
                startRowIndex: startRow - 1,
                endRowIndex: endRow,
                startColumnIndex: 0,
                endColumnIndex: 7,
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.8, green: 1, blue: 0.8 }, // light green
                },
              },
              fields: "userEnteredFormat.backgroundColor",
            },
          },
        ],
      },
    });

    console.log(
      `✅ Додано ${newEvents.length} нових подій у лист "${sheetName}"`
    );
  }
}

export default writeEventsToSheets;
