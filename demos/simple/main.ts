import "@arcgis/map-components/components/arcgis-scene";
import "@ceddc/arcgis-flight-component";
import "@esri/calcite-components/components/calcite-shell";
import "@esri/calcite-components/components/calcite-navigation";
import "@esri/calcite-components/components/calcite-navigation-logo";

import SceneLayer from "@arcgis/core/layers/SceneLayer.js";

// ===== إعدادات سهلة التعديل =====
const CONFIG = {
  flightAltitude: 100,        // ارتفاع الطائرة بالمتر
  flightSpeed: 8,             // سرعة الطائرة م/ث
  qualityProfile: "low",      // "low" | "medium" | "high"
  lodFactor: 0.45,            // 0.3 (أسرع) — 1.0 (أفضل جودة)
  buildingsMinScale: 15000,
  enableShadows: false,       // الظلال مكلفة — أبقها معطلة للأداء
  skyColor: [135, 206, 235, 1], // أزرق سماوي
};

// ===== مراجع العناصر =====
const scene = document.querySelector("arcgis-scene") as any;
const flight = document.querySelector("arcgis-plane-navigation") as any;
const btnBuildings = document.getElementById("btn-buildings") as HTMLButtonElement | null;
const btnHint = document.getElementById("btn-hint") as HTMLButtonElement | null;
const hintEl = document.querySelector(".hint") as HTMLElement | null;
const statusEl = document.getElementById("status") as HTMLElement | null;

let buildingsLayer: SceneLayer | null = null;

// ===== دوال مساعدة =====
function setStatus(text: string): void {
  if (statusEl) statusEl.textContent = text;
}

function updateBuildingsButton(): void {
  if (!btnBuildings || !buildingsLayer) return;
  btnBuildings.disabled = false;
  btnBuildings.textContent = buildingsLayer.visible
    ? "Verberg gebouwen"
    : "Toon gebouwen";
  btnBuildings.classList.toggle("off", !buildingsLayer.visible);
}

// ===== الإعداد الرئيسي =====
async function setupDenHelder(): Promise<void> {
  if (!scene) {
    console.error("ArcGIS scene niet gevonden.");
    return;
  }

  try {
    setStatus("Scène initialiseren...");
    await scene.viewOnReady();

    // ---------- البيئة ----------
    const view = scene.view;

    view.environment.background = {
      type: "color",
      color: CONFIG.skyColor,
    };
    view.environment.atmosphereEnabled = true;

    view.environment.lighting = {
      type: "sun",
      directShadowsEnabled: CONFIG.enableShadows,
    } as any;

    // ---------- جودة الرندر (أخف) ----------
    view.qualityProfile = CONFIG.qualityProfile;

    if (view.qualitySettings?.sceneService?.object) {
      view.qualitySettings.sceneService.object.lodFactor = CONFIG.lodFactor;
    }
    if (view.qualitySettings?.sceneService?.integratedMesh) {
      view.qualitySettings.sceneService.integratedMesh.lodFactor = CONFIG.lodFactor;
    }

    // ---------- طبقة المباني 3DBAG ----------
    setStatus("Gebouwen laden...");

    buildingsLayer = new SceneLayer({
      url: "https://tiles.arcgis.com/tiles/nSZVuSZjHpEZZbRo/arcgis/rest/services/3DBAG_WGS_EGM_V2/SceneServer/layers/0",
      title: "3DBAG 3D Buildings",
      visible: true,
      minScale: CONFIG.buildingsMinScale,
    });

    scene.map.add(buildingsLayer);
    await buildingsLayer.load();

    console.log("3DBAG-gebouwen succesvol geladen.");
    setStatus("Gebouwen geladen");
    updateBuildingsButton();

    // ---------- سرعة الطيران ----------
    if (flight) {
      if (typeof flight.setPowerMode === "function") {
        try { flight.setPowerMode("slow"); } catch { /* noop */ }
      }
      if ("speed" in flight) {
        try { flight.speed = CONFIG.flightSpeed; } catch { /* noop */ }
      }
      flight.setAttribute("start-speed-mps", String(CONFIG.flightSpeed));
    }
  } catch (error) {
    console.error("Fout bij initialisatie:", error);
    setStatus("Fout bij laden");
    if (btnBuildings) {
      btnBuildings.disabled = true;
      btnBuildings.textContent = "Gebouwen niet geladen";
    }
  }
}

// ===== تفاعل الأزرار =====
btnBuildings?.addEventListener("click", () => {
  if (!buildingsLayer) return;
  buildingsLayer.visible = !buildingsLayer.visible;
  updateBuildingsButton();
  setStatus(buildingsLayer.visible ? "Gebouwen zichtbaar" : "Gebouwen verborgen");
});

btnHint?.addEventListener("click", () => {
  if (!hintEl || !btnHint) return;
  const hidden = hintEl.classList.toggle("hidden");
  btnHint.textContent = hidden ? "Toon besturing" : "Verberg besturing";
});

void setupDenHelder();