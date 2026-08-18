/**
 * VeloMotion - Live Pricing & Stripe Checkout Engine
 * RM Studio Universal Engine
 */
const SUPABASE_S2_URL = "https://jhijfulhntlhcytbhcly.supabase.co";
const SUPABASE_S2_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpoaWpmdWxobnRsaGN5dGJoY2x5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3MzcxODcsImV4cCI6MjA5ODMxMzE4N30.z062NW4ApClll-XWHH2ufmcCleBRNHUUdKO6FiLa0TQ";

// 1. Prezzi di Fallback Immediati (Zero Flicker)
const VELOMOTION_PRICES = {
  software: { id: "software", name: "Sblocco Software (32 km/h)", unitPrice: 290 },
  hardware: { id: "hardware", name: "Sblocco Hardware (45 km/h)", unitPrice: 320 }
};

// 2. Render Reattivo del DOM (Supporta sia index.html che dashboard.html)
function renderVeloMotionPrices() {
  // Aggiornamento per index.html
  const elSoft = document.getElementById("price-software-val");
  const elHard = document.getElementById("price-hardware-val");
  if (elSoft) elSoft.innerText = `${VELOMOTION_PRICES.software.unitPrice} €`;
  if (elHard) elHard.innerText = `${VELOMOTION_PRICES.hardware.unitPrice} €`;

  // Aggiornamento pulsanti e totali per dashboard.html (se presenti)
  const btnSoft = document.getElementById("btn-type-software");
  const btnHard = document.getElementById("btn-type-hardware");
  if (btnSoft) btnSoft.innerHTML = `Software (32 km/h) • €${VELOMOTION_PRICES.software.unitPrice}`;
  if (btnHard) btnHard.innerHTML = `Hardware (45 km/h) • €${VELOMOTION_PRICES.hardware.unitPrice}`;

  if (typeof updatePriceDisplay === 'function') {
    if (typeof activeType !== 'undefined' && VELOMOTION_PRICES[activeType]) {
      activePrice = VELOMOTION_PRICES[activeType].unitPrice;
      const unitDisplay = document.getElementById('unit-price-display');
      if (unitDisplay) unitDisplay.innerText = `€ ${activePrice},00`;
    }
    updatePriceDisplay();
  }
}

// 3. Fetch Live da Supabase S2 (saas_pricing)
async function initVeloMotionPricing() {
  try {
    const res = await fetch(`${SUPABASE_S2_URL}/rest/v1/saas_pricing?saas=eq.velomotion&select=*`, {
      headers: {
        'apikey': SUPABASE_S2_KEY,
        'Authorization': `Bearer ${SUPABASE_S2_KEY}`
      },
      cache: 'no-store'
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        data.forEach(item => {
          const pid = (item.plan_id || "").toLowerCase();
          if (VELOMOTION_PRICES[pid]) {
            VELOMOTION_PRICES[pid].unitPrice = Number(item.price);
            if (item.name) VELOMOTION_PRICES[pid].name = item.name;
          }
        });
        renderVeloMotionPrices();
      }
    }
  } catch (e) {
    console.warn("Utilizzo prezzi locali VeloMotion:", e);
  }
}

// 4. Avvio Sessione Stripe on-the-fly tramite n8n
async function avviaCheckoutVeloMotion(type = "software", quantity = 1, officina = null) {
  const plan = VELOMOTION_PRICES[type] || VELOMOTION_PRICES.software;
  const qty = Math.max(1, Number(quantity) || 1);
  const totalPrice = plan.unitPrice * qty;
  const email = officina ? officina.email : "";
  const origin = window.location.origin;

  const payload = {
    progetto: "VeloMotion",
    portal_type: "velomotion",
    title: `VeloMotion • ${qty}x ${plan.name}`,
    price: totalPrice,
    ricarica_tipo: type,
    email: email || undefined,
    agency_id: email ? `officina_${email}` : "officina_anon",
    project_id: officina ? officina.id : "officina_anon",
    origin: origin,
    success_url: `${origin}/dashboard.html?success=true&type=${type}&qty=${qty}`,
    cancel_url: `${origin}/dashboard.html#prezzi`
  };

  const btn = document.getElementById("btn-acquista-ricarica");
  if (btn) {
    btn.innerText = "Apertura Stripe...";
    btn.style.opacity = "0.7";
    btn.style.pointerEvents = "none";
  }

  try {
    const res = await fetch("https://n8n.rmstudio.app/webhook/crea-sessione-stripe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error("Errore sessione");
    const data = await res.json();
    const redirectUrl = data.url || data.checkout_url || data.session_url;

    if (redirectUrl) {
      window.location.href = redirectUrl;
    } else {
      throw new Error("URL Stripe non ricevuto");
    }
  } catch (err) {
    console.error("Errore checkout VeloMotion:", err);
    alert("Impossibile avviare il pagamento. Riprova tra poco.");
  } finally {
    if (btn) {
      btn.innerText = "Acquista Ora su Stripe";
      btn.style.opacity = "1";
      btn.style.pointerEvents = "auto";
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  renderVeloMotionPrices();
  initVeloMotionPricing();
});
