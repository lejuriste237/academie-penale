// ======================== POP-UP D'AVERTISSEMENT ========================
function showWarningPopup() {
  const warningAccepted = localStorage.getItem('warning_ia_accepted');
  if (warningAccepted === 'true') return;
  
  const overlay = document.createElement('div');
  overlay.className = 'warning-overlay';
  overlay.innerHTML = `
    <div class="warning-modal">
      <div class="warning-icon">⚠️</div>
      <div class="warning-title">Attention : L'IA peut se tromper</div>
      <div class="warning-message">
        L'intelligence artificielle utilisée pour générer les corrections peut <strong>confondre certains articles</strong> du Code pénal ou du Code de procédure pénale.
        <br><br>
        Il est <strong>fortement recommandé</strong> de toujours <strong>vérifier les articles cités</strong> dans les textes officiels avant de les utiliser pour vos révisions ou examens.
        <br><br>
        L'Académie Pénale vous invite à la prudence et à la vérification systématique des références juridiques.
      </div>
      <div class="warning-checkbox">
        <input type="checkbox" id="dontShowAgain">
        <label for="dontShowAgain">Ne plus afficher ce message</label>
      </div>
      <button class="warning-btn" id="closeWarningBtn">J'ai compris</button>
    </div>
  `;
  document.body.appendChild(overlay);
  
  document.getElementById('closeWarningBtn').onclick = () => {
    const dontShow = document.getElementById('dontShowAgain').checked;
    if (dontShow) {
      localStorage.setItem('warning_ia_accepted', 'true');
    }
    overlay.remove();
  };
}

setTimeout(showWarningPopup, 500);

// ======================== CONFIGURATION API MISTRAL AI ========================
const MISTRAL_API_KEY = 'TSTlYdHui4PAsQLyaJJhJVjzZVt4ROKz';
const MISTRAL_API_URL = 'https://api.mistral.ai/v1/chat/completions';

// ======================== TEXTES OFFICIELS CAMEROUNAIS ========================
const TEXTES_OFFICIELS = `CODE PENAL CAMEROUNAIS (LOI N°2016/007):
- Art.84: Legitime defense - riposte proportionnee a une agression actuelle
- Art.275: Meurtre - emprisonnement a vie
- Art.276: Assassinat - mort (premeditation, empoisonnement, trafic d'organes)
- Art.277: Blessures graves - 10 a 20 ans
- Art.278: Coups mortels involontaires - 6 a 20 ans
- Art.280: Blessures simples - 6 mois a 5 ans (ITT plus de 30 jours)
- Art.281: Blessures legeres - 6 jours a 2 ans (ITT entre 8 et 30 jours)
- Art.291: Arrestation/sequestration - 5 a 10 ans (10-20 ans si plus d'1 mois)
- Art.318: Vol, abus de confiance, escroquerie - 5 a 10 ans + amende 100.000-1.000.000 F
- Art.320: Vol aggrave - peines doublees (violences, arme, effraction, nuit)
- Art.94: Tentative - punissable si commencement d'execution
- Art.97: Complicite - puni comme auteur principal
- Art.184: Detournement de biens publics - a vie si plus de 500.000 F
- Art.74-1: Personnes morales penalement responsables

CODE DE PROCEDURE PENALE (LOI N°2005/007):
- Art.53: Flagrant delit - arrestation sans mandat possible
- Art.92: Perquisition - avec mandat sauf flagrant delit
- Art.99: Perquisition nocturne interdite entre 18h et 6h
- Art.100: Nullite pour inobservation des formalites
- Art.118-119: Garde a vue - 48h renouvelable une fois (96h max)
- Art.221: Detention provisoire - 6 mois max en correctionnelle
- Art.197: Commission rogatoire
- Art.431: Delai d'appel - 10 jours
- Art.3: Nullite absolue si atteinte aux droits de la defense
- Art.65: Prescription - crime 10 ans, delit 3 ans, contravention 1 an`;

// ======================== ÉTAT ========================
let appState = {
  currentCase: null,
  seen: 0, 
  good: 0, 
  attempts: 0,
  seenIds: new Set(),
  qcmAnswered: false,
  isGenerating: false,
  isStreaming: false
};

function saveProgress() { 
  try {
    localStorage.setItem('academie_penale_mistral', JSON.stringify({ 
      seen: appState.seen, 
      good: appState.good, 
      attempts: appState.attempts, 
      seenIds: Array.from(appState.seenIds) 
    }));
  } catch(e) {}
}

function loadProgress() { 
  try { 
    const s = localStorage.getItem('academie_penale_mistral'); 
    if(s) { 
      const d = JSON.parse(s); 
      appState.seen = d.seen || 0; 
      appState.good = d.good || 0; 
      appState.attempts = d.attempts || 0; 
      appState.seenIds = new Set(d.seenIds || []); 
    } 
  } catch(e) {} 
  updateStats(); 
}

function updateStats() { 
  document.getElementById('seenCount').textContent = appState.seen; 
  document.getElementById('goodCount').textContent = appState.good; 
  const rate = appState.attempts ? Math.round((appState.good / appState.attempts) * 100) : null; 
  document.getElementById('rateCount').textContent = rate !== null ? rate + '%' : '—'; 
}

function showToast(msg, isError = false) { 
  const t = document.getElementById('toast'); 
  t.textContent = msg; 
  t.style.borderColor = isError ? 'var(--red)' : 'var(--gold)'; 
  t.classList.add('show'); 
  setTimeout(() => t.classList.remove('show'), 2500); 
}

// ======================== GÉNÉRATION D'UN CAS PAR MISTRAL AI ========================
async function generateCase() {
  if (appState.isGenerating) return;
  appState.isGenerating = true;
  
  const theme = document.getElementById('themeSelect').value;
  const difficulty = document.getElementById('difficultySelect').value;
  const mode = document.getElementById('modeSelect').value;
  
  document.getElementById('badgeTheme').textContent = theme;
  document.getElementById('badgeDifficulty').textContent = difficulty;
  document.getElementById('badgeMode').textContent = mode === 'qcm' ? 'QCM' : (mode === 'redaction' ? 'Rédaction' : 'Mixte');
  document.getElementById('caseTitle').textContent = 'Génération en cours...';
  document.getElementById('caseScenario').textContent = 'L\'IA prépare un nouveau cas pratique...';
  document.getElementById('caseBody').innerHTML = `
    <div style="text-align:center; padding:40px;">
      <div class="loading" style="width:32px;height:32px;margin:0 auto 16px;"></div>
      <p>⏳ Création d'un cas pratique sur mesure...</p>
      <p style="font-size:0.8rem; margin-top:12px;">Thème: ${theme} | Difficulté: ${difficulty} | Mode: ${mode}</p>
    </div>
  `;
  document.getElementById('caseNav').classList.add('hidden');
  document.getElementById('showCorrectionBtn').disabled = true;
  document.getElementById('aiCorrectionBtn').disabled = true;
  
  const villes = ["Yaounde", "Douala", "Garoua", "Bafoussam", "Maroua", "Bamenda", "Limbe", "Bertoua", "Ebolowa", "Ngaoundere"];
  const ville = villes[Math.floor(Math.random() * villes.length)];
  const jour = Math.floor(Math.random() * 28) + 1;
  const mois = ["janvier", "fevrier", "mars", "avril", "mai", "juin", "juillet", "aout", "septembre", "octobre", "novembre", "decembre"][Math.floor(Math.random() * 12)];
  
  const prompt = `Genere un cas pratique de ${difficulty} en ${theme} (droit camerounais). 
Lieu: ${ville}, date: ${jour} ${mois} 2024. Mode: ${mode === 'mixte' ? 'QCM + redaction' : mode}.
Cree un scenario realiste avec prenoms et noms camerounais.
Reponds UNIQUEMENT au format JSON valide, sans aucun texte avant ou apres:

{
  "title": "titre du cas",
  "scenario": "scenario detaille",
  "questions": ["question1", "question2", "question3"],
  "qcm": {
    "prompt": "question du QCM",
    "options": ["option A", "option B", "option C", "option D"],
    "answer": 0,
    "explanation": "explication"
  },
  "correction": "correction modele complete avec references aux articles"
}`;

  try {
    const response = await fetch(MISTRAL_API_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'Authorization': `Bearer ${MISTRAL_API_KEY}`
      },
      body: JSON.stringify({
        model: 'mistral-small-latest',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1200,
        temperature: 0.7
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error ${response.status}: ${errorText.substring(0, 200)}`);
    }
    
    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || '';
    
    content = content.trim();
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      let caseData;
      try {
        caseData = JSON.parse(jsonMatch[0]);
      } catch(e) {
        console.error("JSON parse error:", e);
        caseData = {
          title: `Cas pratique de ${theme} à ${ville}`,
          scenario: `Le ${jour} ${mois} 2024, à ${ville}, un individu commet une infraction.`,
          questions: ["Qualifiez les faits.", "Quelle peine encourt l'auteur ?", "Quels sont les textes applicables ?"],
          qcm: { prompt: "Quelle est la qualification pénale ?", options: ["Option A", "Option B", "Option C", "Option D"], answer: 0, explanation: "Explication selon le Code pénal." },
          correction: `Correction selon le Code pénal camerounais.`
        };
      }
      
      const newCase = {
        id: Date.now(),
        theme: theme,
        difficulty: difficulty,
        mode: mode,
        title: caseData.title || `Cas pratique sur ${theme}`,
        scenario: caseData.scenario || `Scénario à ${ville} le ${jour} ${mois} 2024.`,
        questions: caseData.questions || ["Qualifiez les faits.", "Quelle peine encourt l'auteur ?", "Quels sont les textes applicables ?"],
        qcm: caseData.qcm || {
          prompt: "Quelle est la qualification pénale ?",
          options: ["Option A", "Option B", "Option C", "Option D"],
          answer: 0,
          explanation: "Explication selon le Code pénal camerounais."
        },
        correction: caseData.correction || `<strong>Qualification :</strong> Selon le Code pénal camerounais.<br><div class="doc-ref">Reference : Code penal camerounais (Loi n°2016/007)</div>`
      };
      
      appState.currentCase = newCase;
      appState.qcmAnswered = false;
      
      if (!appState.seenIds.has(newCase.id)) {
        appState.seenIds.add(newCase.id);
        appState.seen++;
        saveProgress();
        updateStats();
      }
      
      renderCase(newCase);
      document.getElementById('showCorrectionBtn').disabled = false;
      document.getElementById('aiCorrectionBtn').disabled = false;
      document.getElementById('caseNav').classList.remove('hidden');
      document.getElementById('casePool').textContent = `Genere par Mistral AI · Cas n°${appState.seen}`;
      showToast(`Cas genere : "${newCase.title}"`);
    } else {
      throw new Error('Format JSON invalide');
    }
  } catch (err) {
    console.error('Erreur Mistral API:', err);
    document.getElementById('caseBody').innerHTML = `
      <div style="text-align:center; padding:40px; color: var(--red);">
        <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
        <p>Erreur: ${err.message}</p>
        <p style="margin-top: 12px;">Verifiez votre connexion et votre clé API Mistral.</p>
        <button class="btn-gold" id="retryBtn" style="margin-top: 20px;">🔄 Reessayer</button>
      </div>
    `;
    const retryBtn = document.getElementById('retryBtn');
    if (retryBtn) retryBtn.onclick = () => generateCase();
    showToast('Erreur de generation', true);
  }
  
  appState.isGenerating = false;
}

// ======================== AFFICHAGE ========================
function renderCase(c) {
  document.getElementById('badgeTheme').textContent = c.theme;
  document.getElementById('badgeDifficulty').textContent = c.difficulty;
  document.getElementById('badgeMode').textContent = c.mode === 'qcm' ? 'QCM' : (c.mode === 'redaction' ? 'Rédaction' : 'Mixte');
  document.getElementById('caseTitle').textContent = c.title;
  document.getElementById('caseScenario').textContent = c.scenario;
  
  let html = `<div class="section-title">📋 Questions juridiques</div><ul class="questions-list">${c.questions.map(q => `<li>${q}</li>`).join('')}</ul>`;
  
  if (c.mode === 'qcm' || c.mode === 'mixte') {
    html += `<div class="section-title">❓ ${c.qcm.prompt}</div><div id="qcmArea">`;
    c.qcm.options.forEach((opt, i) => {
      html += `<label class="qcm-option"><input type="radio" name="qcm" value="${i}"><div class="qcm-label"><span class="qcm-letter">${String.fromCharCode(65 + i)}</span><span>${opt}</span></div></label>`;
    });
    html += `<div id="qcmFeedback" class="hidden"></div><button class="btn-gold" id="checkQcmBtn" style="margin-top:12px">✔ Valider</button></div>`;
  }
  
  if (c.mode === 'redaction' || c.mode === 'mixte') {
    html += `<div class="section-title">✏️ Votre analyse juridique</div><textarea id="redactionArea" placeholder="Redigez votre reponse en suivant la methode :&#10;1. Rappel des faits&#10;2. Qualification juridique&#10;3. Application des textes&#10;4. Solution et peine encourue"></textarea><div class="word-count" id="wordCount">0 mots</div>`;
  }
  
  html += `<div id="correctionBlock" class="hidden"></div>`;
  document.getElementById('caseBody').innerHTML = html;
  
  if (c.mode === 'qcm' || c.mode === 'mixte') {
    document.querySelectorAll('input[name="qcm"]').forEach(r => r.onchange = () => { const btn = document.getElementById('checkQcmBtn'); if (btn) btn.disabled = false; });
    const btn = document.getElementById('checkQcmBtn');
    if (btn) { btn.disabled = true; btn.onclick = () => checkQCM(c); }
  }
  
  if (c.mode === 'redaction' || c.mode === 'mixte') {
    const ta = document.getElementById('redactionArea');
    if (ta) ta.oninput = () => { const wc = document.getElementById('wordCount'); const words = ta.value.trim().split(/\s+/).filter(w => w).length; wc.textContent = words + ' mots'; };
  }
}

function checkQCM(c) {
  if (appState.qcmAnswered) return;
  const selected = document.querySelector('input[name="qcm"]:checked');
  const fb = document.getElementById('qcmFeedback');
  if (!selected) { fb.textContent = 'Veuillez sélectionner une réponse'; fb.classList.remove('hidden'); fb.className = 'feedback bad'; return; }
  appState.qcmAnswered = true;
  appState.attempts++;
  const isCorrect = parseInt(selected.value) === c.qcm.answer;
  if (isCorrect) appState.good++;
  saveProgress();
  updateStats();
  
  document.querySelectorAll('.qcm-option').forEach((opt, i) => {
    opt.classList.add('locked');
    opt.querySelector('input').disabled = true;
    if (i === c.qcm.answer) opt.classList.add('correct');
    else if (i === parseInt(selected.value) && !isCorrect) opt.classList.add('wrong');
  });
  
  fb.classList.remove('hidden');
  fb.className = isCorrect ? 'feedback good' : 'feedback bad';
  fb.innerHTML = isCorrect ? `✅ ${c.qcm.explanation}` : `❌ ${c.qcm.explanation}`;
  const btn = document.getElementById('checkQcmBtn');
  if (btn) btn.disabled = true;
  showToast(isCorrect ? 'Bonne reponse !' : 'Mauvaise reponse', !isCorrect);
}

function showStaticCorrection() {
  if (!appState.currentCase) return;
  const block = document.getElementById('correctionBlock');
  block.innerHTML = `<div class="section-title">📖 Correction modèle</div><div class="static-correction">${appState.currentCase.correction}<br><br><div class="doc-ref">Reference : Code penal camerounais (Loi n°2016/007) / Code de procedure penale (Loi n°2005/007)</div></div>`;
  block.classList.remove('hidden');
  block.scrollIntoView({ behavior: 'smooth' });
}

// ======================== CORRECTION IA MISTRAL ========================
async function showAICorrection() {
  if (!appState.currentCase || appState.isStreaming) return;
  appState.isStreaming = true;
  const block = document.getElementById('correctionBlock');
  block.innerHTML = `<div class="section-title">✨ Correction IA personnalisee (Mistral AI)</div><div class="ai-correction"><div class="ai-header"><div class="ai-icon">⚖️</div><div><strong>Consultation des textes officiels... <span class="loading"></span></strong></div></div><p>Analyse en cours...</p></div>`;
  block.classList.remove('hidden');
  document.getElementById('aiCorrectionBtn').disabled = true;
  
  const userAnswer = document.getElementById('redactionArea') ? document.getElementById('redactionArea').value : '';
  const c = appState.currentCase;
  
  const prompt = `Tu es professeur de droit penal camerounais.

TEXTES OFFICIELS CAMEROUNAIS:
${TEXTES_OFFICIELS}

CAS PRATIQUE:
Titre: ${c.title}
Scenario: ${c.scenario.substring(0, 400)}
Questions: ${c.questions.join(', ')}
Correction modele: ${c.correction.substring(0, 300)}
Reponse de l'etudiant: ${userAnswer || "Aucune reponse fournie"}

⚠️ ATTENTION: Les articles cites par l'IA peuvent parfois etre errones. L'utilisateur est invite a verifier les references dans les textes officiels.

Donne une correction complete avec:
1. QUALIFICATION JURIDIQUE: qualification exacte + article precis
2. CONDITIONS: enumere les conditions legales
3. APPLICATION: applique la regle aux faits
4. SOLUTION: decision du tribunal
5. COMMENTAIRE: analyse la reponse de l'etudiant + conseils

Cite les articles. Utilise HTML. Sois pedagogique.`;

  try {
    const response = await fetch(MISTRAL_API_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'Authorization': `Bearer ${MISTRAL_API_KEY}`
      },
      body: JSON.stringify({
        model: 'mistral-small-latest',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1200,
        temperature: 0.3
      })
    });
    
    if (!response.ok) {
      throw new Error(`API Error ${response.status}`);
    }
    
    const data = await response.json();
    let aiReply = data.choices?.[0]?.message?.content || "Erreur de generation.";
    aiReply = aiReply.replace(/\n/g, '<br>');
    const aiHtml = `<div class="ai-correction"><div class="ai-header"><div class="ai-icon">📚</div><div><strong>Correction IA - Mistral AI</strong></div></div><div style="line-height: 1.8;">${aiReply}</div><br><hr><div class="doc-ref">⚠️ <strong>Attention :</strong> L'IA peut commettre des erreurs. Veuillez vérifier les articles cités dans les textes officiels.<br>Sources : Code penal camerounais (Loi n°2016/007) - Code de procedure penale (Loi n°2005/007)</div></div>`;
    document.querySelector('.ai-correction').outerHTML = aiHtml;
    showToast('Correction IA generee - Verifiez les references');
  } catch (err) {
    console.error('Erreur Mistral API correction:', err);
    document.querySelector('.ai-correction').innerHTML = '<p>❌ Erreur de connexion a Mistral AI. Reessayez.</p>';
    showToast('Erreur IA', true);
  }
  appState.isStreaming = false;
  document.getElementById('aiCorrectionBtn').disabled = false;
}

function resetProgress() {
  if (confirm('Reinitialiser toute progression ?')) {
    appState.seen = 0;
    appState.good = 0;
    appState.attempts = 0;
    appState.seenIds.clear();
    appState.qcmAnswered = false;
    saveProgress();
    updateStats();
    generateCase();
    showToast('Progression reinitialisee');
  }
}

// ======================== EVENEMENTS ========================
document.getElementById('randomBtn').onclick = generateCase;
document.getElementById('showCorrectionBtn').onclick = showStaticCorrection;
document.getElementById('aiCorrectionBtn').onclick = showAICorrection;
document.getElementById('resetBtn').onclick = resetProgress;
document.getElementById('themeSelect').onchange = generateCase;
document.getElementById('difficultySelect').onchange = generateCase;
document.getElementById('modeSelect').onchange = generateCase;

// ======================== INITIALISATION ========================
loadProgress();
generateCase();
