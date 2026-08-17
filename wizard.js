/**
 * VeloMotion - Wizard Verificatore Compatibilità Bosch
 */
let selectedMagnet = '';
let selectedDisplay = '';
let inputFirmware = '';

async function handleContactSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);
  const button = form.querySelector("button[type='submit']");
  const originalText = button.innerText;
  button.innerText = "Invio candidatura...";
  button.disabled = true;

  try {
    const res = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      body: formData
    });
    if (res.ok) {
      alert("Candidatura inviata con successo! Ti contatteremo entro 24 ore per pianificare l'attivazione della tua officina.");
      form.reset();
    } else {
      alert("Errore nell'invio. Si prega di riprovare più tardi.");
    }
  } catch {
    alert("Errore di connessione. Controlla la tua rete.");
  } finally {
    button.innerText = originalText;
    button.disabled = false;
  }
}

function selectMagnet(magnetType) {
  selectedMagnet = magnetType;
  document.getElementById('step-dot-1').classList.remove('bg-cyan-500', 'text-slate-950');
  document.getElementById('step-dot-1').classList.add('bg-emerald-500', 'text-slate-950');
  document.getElementById('line-1').classList.replace('bg-gray-800', 'bg-emerald-500');
  document.getElementById('step-dot-2').classList.replace('bg-slate-800', 'bg-cyan-500');
  document.getElementById('step-dot-2').classList.replace('text-gray-400', 'text-slate-950');
  document.getElementById('step-1').classList.add('hidden');
  document.getElementById('step-2').classList.remove('hidden');
}

function selectDisplay(displayType) {
  selectedDisplay = displayType;
  document.getElementById('step-dot-2').classList.remove('bg-cyan-500', 'text-slate-950');
  document.getElementById('step-dot-2').classList.add('bg-emerald-500', 'text-slate-950');
  document.getElementById('line-2').classList.replace('bg-gray-800', 'bg-emerald-500');
  document.getElementById('step-dot-3').classList.replace('bg-slate-800', 'bg-cyan-500');
  document.getElementById('step-dot-3').classList.replace('text-gray-400', 'text-slate-950');
  document.getElementById('step-2').classList.add('hidden');
  document.getElementById('step-3').classList.remove('hidden');
}

function goBack(stepNumber) {
  if (stepNumber === 1) {
    document.getElementById('step-dot-1').classList.replace('bg-emerald-500', 'bg-cyan-500');
    document.getElementById('line-1').classList.replace('bg-emerald-500', 'bg-gray-800');
    document.getElementById('step-dot-2').classList.replace('bg-cyan-500', 'bg-slate-800');
    document.getElementById('step-dot-2').classList.add('text-gray-400');
    document.getElementById('step-2').classList.add('hidden');
    document.getElementById('step-1').classList.remove('hidden');
  } else if (stepNumber === 2) {
    document.getElementById('step-dot-2').classList.replace('bg-emerald-500', 'bg-cyan-500');
    document.getElementById('line-2').classList.replace('bg-emerald-500', 'bg-gray-800');
    document.getElementById('step-dot-3').classList.replace('bg-cyan-500', 'bg-slate-800');
    document.getElementById('step-dot-3').classList.add('text-gray-400');
    document.getElementById('step-3').classList.add('hidden');
    document.getElementById('step-2').classList.remove('hidden');
  }
}

function processCompatibility() {
  const fwInput = document.getElementById('fw-input').value.trim();
  const nomeClienteInput = document.getElementById('nome-cliente-input') ? document.getElementById('nome-cliente-input').value.trim() : "Bici senza nome";
  
  if (!fwInput) {
    alert("Per favore, inserisci la versione del firmware rilevata sul display.");
    return;
  }
  inputFirmware = fwInput;

  const parts = fwInput.split('.').map(Number);
  const major = parts[0];
  const minor = parts[1];

  const resultBox = document.getElementById('result-box');
  const whatsappLink = document.getElementById('whatsapp-link');
  resultBox.className = "p-6 rounded-xl border text-center space-y-4 ";

  let isCompatible = false;
  let title = "";
  let description = "";

  if (isNaN(major) || isNaN(minor)) {
    resultBox.classList.add("bg-red-500/10", "border-red-500/20");
    title = "⚠️ Errore di formato";
    description = "Il formato del firmware inserito non è valido (es: 15.24.2).";
  } else if (major < 19 || (major === 19 && minor <= 24)) {
    isCompatible = true;
    resultBox.classList.add("bg-emerald-500/10", "border-emerald-500/20");
    title = "✅ COMPATIBILE CON VELOMOTION";
    description = selectedMagnet === 'valvola'
      ? "La e-bike con sensore sulla valvola (Rim Magnet) è compatibile con sblocco software a 32 km/h."
      : "La e-bike con sensore sui raggi è compatibile con sblocco software a 32 km/h o hardware fino a 45 km/h.";
  } else {
    resultBox.classList.add("bg-amber-500/10", "border-amber-500/20");
    title = "⚠️ Firmware recente";
    description = `La versione software ${fwInput} è recente. Contattaci per verificare la fattibilità dello sblocco.`;
  }

  resultBox.innerHTML = `
    <h3 class="text-2xl font-bold font-outfit ${isCompatible ? 'text-emerald-400' : 'text-amber-400'}">${title}</h3>
    <p class="text-sm text-gray-300 leading-relaxed max-w-xl mx-auto">${description}</p>
    <div class="text-xs text-gray-500 mt-4">
      Magnete: <span class="font-semibold text-white">${selectedMagnet === 'valvola' ? 'Valvola (Rim Magnet)' : 'Raggi'}</span> | 
      Display: <span class="font-semibold text-white">${selectedDisplay}</span> | 
      Software: <span class="font-semibold text-white">${fwInput}</span>
    </div>
  `;

  if (isCompatible) {
    fetch('https://n8n.rmstudio.app/webhook/velomotion-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome_cliente: nomeClienteInput,
        magnete: selectedMagnet,
        display: selectedDisplay,
        firmware: fwInput
      })
    }).catch(err => console.error("Errore n8n:", err));
  }

  const mailSubject = encodeURIComponent(`Sblocco VeloMotion per ${nomeClienteInput}`);
  const mailBody = encodeURIComponent(`Ciao Riccardo,\n\nHo verificato la e-bike: Magnete: ${selectedMagnet}, Display: ${selectedDisplay}, Firmware: ${fwInput}. Vorrei info sulla partnership.`);
  whatsappLink.href = `mailto:info@rmstudio.app?subject=${mailSubject}&body=${mailBody}`;
  whatsappLink.innerHTML = "Richiesta Inviata con Successo";
  whatsappLink.classList.replace('bg-cyan-500', 'bg-emerald-600');
  whatsappLink.classList.add('pointer-events-none');

  document.getElementById('step-3').classList.add('hidden');
  document.getElementById('step-result').classList.remove('hidden');
}

function restartWizard() {
  selectedMagnet = '';
  selectedDisplay = '';
  inputFirmware = '';
  document.getElementById('fw-input').value = '';
  document.getElementById('step-dot-1').className = "w-8 h-8 rounded-full bg-cyan-500 text-slate-950 font-bold flex items-center justify-center text-sm transition-colors duration-300";
  document.getElementById('step-dot-2').className = "w-8 h-8 rounded-full bg-slate-800 text-gray-400 font-bold flex items-center justify-center text-sm transition-colors duration-300";
  document.getElementById('step-dot-3').className = "w-8 h-8 rounded-full bg-slate-800 text-gray-400 font-bold flex items-center justify-center text-sm transition-colors duration-300";
  document.getElementById('line-1').className = "h-0.5 bg-gray-800 flex-grow mx-2";
  document.getElementById('line-2').className = "h-0.5 bg-gray-800 flex-grow mx-2";
  document.getElementById('step-result').classList.add('hidden');
  document.getElementById('step-1').classList.remove('hidden');
}

// Iniezione Orbit
document.addEventListener("DOMContentLoaded", () => {
  fetch("https://raw.githubusercontent.com/Rickym2025/mrstudio/main/public/orbit-template.html")
    .then(res => res.text())
    .then(html => {
      const target = document.getElementById('orbit-container-target');
      if (target) target.innerHTML = html;
    })
    .catch(err => console.error("Errore orbitale:", err));
});
