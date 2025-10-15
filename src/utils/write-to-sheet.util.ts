import getSheetsClient from "./get-sheets-client.util";
import { SHEET_ID } from "../constants/contants";
import scrapeEvents from "./scrape-events.util";

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

// === WRITE EVENTS TO SHEETS ===
async function writeToSheets(events: Awaited<ReturnType<typeof scrapeEvents>>) {
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

    // Create sheet if it doesn't exist
    try {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SHEET_ID,
        requestBody: {
          requests: [{ addSheet: { properties: { title: sheetName } } }],
        },
      });
    } catch (err) {
      // Sheet may already exist, ignore
    }

    const rows = [
      ["Назва події", "Дата", "Локація", "Ціна", "Опис", "Тип", "Посилання"],
      ...eventsByMonth[month].map((e) => [
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
      range: `${sheetName}!A1`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: rows },
    });

    console.log(
      `✅ Завантажено ${eventsByMonth[month].length} подій у лист "${sheetName}"`
    );
  }
}

export default writeToSheets;
