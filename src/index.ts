import scrapeEvents from "./utils/scrape-events.util";
import writeToSheet from "./utils/write-events-to-sheets.util";

// === MAIN ===
(async () => {
  try {
    console.log("🔍 Scraping DOU events...");
    const events = await scrapeEvents();
    console.log(`Found ${events.length} events.`);

    console.log("📤 Updating Google Sheet...");
    await writeToSheet(events);

    console.log("✅ Done!");
  } catch (err) {
    console.error("❌ Error:", err);
  }
})();
