<script setup lang="ts">
import { LOCALE_CODES, textDirection, type LocaleCode } from "@perkly/contracts";
import { computed, onMounted, ref, watch } from "vue";
import { readInitialLocale, storeLocale } from "../locale-preference";
import { homeCopy, languageNames } from "../messages";

type ApiState = "loading" | "up" | "down";

const locale = ref<LocaleCode>(readInitialLocale());
const apiState = ref<ApiState>("loading");
const copy = computed(() => homeCopy[locale.value]);

watch(
  locale,
  (next) => {
    document.documentElement.lang = next;
    document.documentElement.dir = textDirection(next);
    document.title = "Perkly";
  },
  { immediate: true },
);

function setLocale(next: LocaleCode): void {
  locale.value = next;
  storeLocale(next);
}

onMounted(() => {
  void loadApiState();
});

async function loadApiState(): Promise<void> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    try {
      const response = await fetch("/api/v1");
      if (response.ok) {
        const body: unknown = await response.json();
        if (isPerklyDescriptor(body)) {
          apiState.value = "up";
          return;
        }
      }
    } catch {
      // The dev server may still be starting.
    }
    await delay(150);
  }
  apiState.value = "down";
}

function isPerklyDescriptor(body: unknown): boolean {
  if (typeof body !== "object" || body === null) {
    return false;
  }
  return (
    "name" in body &&
    body.name === "perkly" &&
    "database" in body &&
    body.database === "not_connected"
  );
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}
</script>

<template>
  <div class="shell">
    <header>
      <h1>Perkly</h1>
      <div class="languages" role="group" :aria-label="copy.languageLabel">
        <button
          v-for="code in LOCALE_CODES"
          :key="code"
          type="button"
          :lang="code"
          :aria-pressed="locale === code"
          @click="setLocale(code)"
        >
          {{ languageNames[code] }}
        </button>
      </div>
    </header>
    <main class="panel">
      <p>{{ copy.lead }}</p>
      <p>{{ copy.payment }}</p>
      <p>{{ copy.shell }}</p>
      <p>{{ copy.databaseNext }}</p>
      <p class="status" role="status" aria-live="polite">
        {{
          apiState === "loading" ? copy.apiLoading : apiState === "up" ? copy.apiUp : copy.apiDown
        }}
      </p>
    </main>
  </div>
</template>
