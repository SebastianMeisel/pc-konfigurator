"use strict";

const { readFileSync } = require("node:fs");
const vm = require("node:vm");

(async () => {
  const window = {};
  const context = {
    window,
    document: { querySelector() { return null; } },
    fetch: async url => ({
      ok: true,
      status: 200,
      async json() { return JSON.parse(readFileSync(url, "utf8")); }
    }),
    console,
    Object,
    Array,
    Set,
    Error,
    Promise
  };
  vm.runInNewContext(readFileSync("content-loader.js", "utf8"), context, {
    filename: "content-loader.js"
  });
  const content = await window.BuildBenchContent.ready;
  const count = Object.values(content.components.components)
    .reduce((sum, items) => sum + items.length, 0);
  if (content.components.categories.length !== 12 || count !== 72) {
    throw new Error("Der Inhalts-Loader liefert einen unvollständigen Komponentenkatalog.");
  }
  if (content.lessons.lessons.length !== 16 || content.network.groups.length !== 2 || content.compatibility.rules.length < 30) {
    throw new Error("Der Inhalts-Loader liefert unvollständige Lern- oder Netzwerkdaten.");
  }
  console.log("Inhalts-Loader bestanden (vier JSON-Dateien gemeinsam geladen).");
})().catch(error => {
  console.error(error);
  process.exit(1);
});
