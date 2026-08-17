/**
 * VeloMotion - Live Pricing & Stripe Checkout Engine
 * RM Studio Universal Engine
 */
const VELOMOTION_PRICES = {
  software: { id: "software", name: "Sblocco Software (32 km/h)", unitPrice: 290 },
  hardware: { id: "hardware", name: "Sblocco Hardware (45 km/h)", unitPrice: 320 }
};

async function initVeloMotionPricing() {
  try {
    const res = await fetch("https://zqkqlhosyjvxdwfjmwwb.supabase.co/rest/v1/saas_pricing?saas=eq.velomotion&select=*");
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        data.forEach(item => {
          const pid = (item.plan_id || "").toLowerCase();
          if (VELOMOTION_PRICES[pid]) {
            VELOMOTION_PRICES[pid].unitPrice = Number(item.price);
          }
        });
      }
    }
  } catch (e) {
    console.warn("Utilizzo prezzi locali VeloMotion:", e);
  }

  const elSoft = document.getElementById("price-software-val");
  const elHard = document.getElementById("price-hardware-val");
  if (elSoft) elSoft.innerText = `${VELOMOTION_PRICES.software.unitPrice} €`;
  if (elHard) elHard.innerText = `${VELOMOTION_PRICES.hardware.unitPrice} €`;
}

async function avviaCheckoutVeloMotion(type = "software", quantity = 1, officina = null) {
  const plan = VELOMOTION_PRICES[type] || VELOMOTION_PRICES.software;
  const totalPrice = plan.unitPrice * Math.max(1, Number(quantity) || 1);
  const email = officina ? officina.email : "";
  const origin = window.location.origin;

  const payload = {
    progetto: "VeloMotion",
    portal_type: "velomotion",
    title: `VeloMotion • ${quantity}x ${plan.name}`,
    price: totalPrice,
    ricarica_tipo: type,
    email: email || undefined,
    agency_id: email ? `officina_${email}` : "officina_anon",
    project_id: officina ? officina.id : "officina_anon",
    origin: origin,
    success_url: `${origin}/dashboard.html?success=true&type=${type}&qty=${quantity}`,
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

document.addEventListener("DOMContentLoaded", initVeloMotionPricing);
