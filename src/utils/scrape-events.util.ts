import axios from "axios";
import * as cheerio from "cheerio";
import { DOU_URL } from "../constants/contants";

interface EventItem {
  name: string;
  url: string;
  date: string;
  location: string;
  price: string;
  description: string;
  type: string;
}

// === SCRAPE EVENTS FROM DOU ===
async function scrapeEvents(): Promise<EventItem[]> {
  const { data } = await axios.get(DOU_URL, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });

  const $ = cheerio.load(data);
  const events: EventItem[] = [];

  let currentDate = "";

  $(".info, .b-postcard").each((_, el) => {
    const element = $(el);

    // Date header (like "15 жовтня")
    if (element.hasClass("info")) {
      const dateText = element.find("a.date").text().trim();
      if (dateText) currentDate = dateText;
      return;
    }

    // Event card
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

      // Clean up details block
      const details = rawDetails
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l !== "")
        .map((l) => l.replace(/\s+/g, " "))
        .filter(Boolean);

      let date = currentDate;
      let location = "";
      let price = "";

      // Usually the structure is:
      // [ "15 жовтня", "Online", "Безплатно" ]
      if (details.length === 3) {
        [, location, price] = details;
      } else if (details.length === 2) {
        [, location] = details;
      } else if (details.length === 1) {
        location = details[0];
      }

      // Remove any extra parentheses or notes from price if needed
      price = price.replace(/\s*\(.*?\)\s*/g, "").trim();

      events.push({
        name,
        url,
        date,
        location,
        price,
        description,
        type,
      });
    }
  });

  return events;
}

export default scrapeEvents;
