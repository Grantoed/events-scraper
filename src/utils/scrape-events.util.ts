import axios from "axios";
import * as cheerio from "cheerio";
import { DOU_URL } from "../constants/contants";
import { EventItem } from "../types/types";

// === SCRAPE EVENTS FROM DOU ===
async function scrapeEvents(): Promise<EventItem[]> {
  const events: EventItem[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const url = page === 1 ? DOU_URL : `${DOU_URL}${page}/`;

    let data: string;
    try {
      const response = await axios.get(url, {
        headers: { "User-Agent": "Mozilla/5.0" },
      });
      data = response.data;
    } catch (err: any) {
      if (err.response?.status === 404) {
        hasMore = false; // Stop scraping if page does not exist
        break;
      } else {
        throw err; // rethrow other errors
      }
    }

    const $ = cheerio.load(data);
    let currentDate = "";

    $(".info, .b-postcard").each((_, el) => {
      const element = $(el);

      if (element.hasClass("info")) {
        const dateText = element.find("a.date").text().trim();
        if (dateText) currentDate = dateText;
        return;
      }

      if (element.hasClass("b-postcard")) {
        const titleEl = element.find("h2.title a");
        const name = titleEl.text().trim();
        const url = titleEl.attr("href")?.trim() || "";

        const rawDetails = element.find(".when-and-where").text().trim();
        const description = element.find("p.b-typo").text().trim();
        const type = element
          .find(".more a")
          .map((_, a) => $(a).text().trim())
          .get()
          .join(", ");

        const details = rawDetails
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean);

        let date = currentDate;
        let location = "";
        let price = "";

        if (details.length === 3) [, location, price] = details;
        else if (details.length === 2) [, location] = details;
        else if (details.length === 1) location = details[0];

        price = price.replace(/\s*\(.*?\)\s*/g, "").trim();

        events.push({ name, url, date, location, price, description, type });
      }
    });

    page++;
  }

  return events;
}

export default scrapeEvents;
