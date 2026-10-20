import assert from "node:assert/strict";
import test from "node:test";
import {
  resolveLocale,
  serviceDescriptor,
  textDirection,
  type LocaleCode,
} from "@perkly/contracts";

test("Hebrew and Arabic are right to left, and English is left to right", () => {
  const directions: Record<LocaleCode, "ltr" | "rtl"> = {
    en: "ltr",
    he: "rtl",
    ar: "rtl",
  };
  assert.equal(textDirection("en"), directions.en);
  assert.equal(textDirection("he"), directions.he);
  assert.equal(textDirection("ar"), directions.ar);
});

test("a stored locale wins over the browser language", () => {
  assert.equal(resolveLocale("ar", ["en-US"]), "ar");
});

test("the browser language selects Hebrew, including the older iw tag", () => {
  assert.equal(resolveLocale(null, ["he-IL", "en"]), "he");
  assert.equal(resolveLocale(null, ["iw-IL"]), "he");
});

test("an unknown language falls back to English", () => {
  assert.equal(resolveLocale(null, ["fr-FR"]), "en");
  assert.equal(resolveLocale("nope", ["fr"]), "en");
});

test("the shell descriptor does not describe a merchant charge", () => {
  assert.equal(serviceDescriptor.name, "perkly");
  assert.equal(serviceDescriptor.database, "not_connected");
  assert.equal("payment" in serviceDescriptor, false);
  assert.equal("checkout" in serviceDescriptor, false);
});
