import { useState, useEffect, useRef } from "react";

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;900&family=Rajdhani:wght@300;400;500;600;700&display=swap');`;

const STATUS_CONFIG = {
  gravado:      { label: "🎙️ Gravado",               color: "#7B61FF", bg: "rgba(123,97,255,0.15)" },
  edicao:       { label: "✂️ Em Edição",              color: "#00D4FF", bg: "rgba(0,212,255,0.12)" },
  alteracao:    { label: "🔄 Em Alteração",           color: "#FF9500", bg: "rgba(255,149,0,0.12)" },
  aprovacao:    { label: "⏳ Aguardando Aprovação",   color: "#FFD600", bg: "rgba(255,214,0,0.12)" },
  pronto:       { label: "📤 Pronto para Postagem",   color: "#00FF94", bg: "rgba(0,255,148,0.12)" },
  youtube:      { label: "▶️ Postado no YouTube",     color: "#FF003C", bg: "rgba(255,0,60,0.12)" },
  tv:           { label: "📺 Exibido na TV",          color: "#FF6EC7", bg: "rgba(255,110,199,0.12)" },
};

const STATUS_ORDER = ["gravado","edicao","alteracao","aprovacao","pronto","youtube","tv"];

const USERS = [
  { id: "ana",    name: "Ana Beatriz",   role: "admin",   avatar: "AB" },
  { id: "carlos", name: "Carlos Melo",   role: "editor",  avatar: "CM" },
  { id: "lucia",  name: "Lúcia Ferraz",  role: "producao", avatar: "LF" },
];

const INITIAL_EPISODES = [
  {
    id: "ep001", title: "Direito Digital no Século XXI", number: 1,
    description: "Debate sobre os impactos da inteligência artificial no ordenamento jurídico brasileiro.",
    status: "youtube", responsible: "ana", guests: ["Dr. Paulo Salave'a","Dra. Marina Sousa"],
    recordingDate: "2025-03-10", deadlineEdit: "2025-03-20", deadlinePublish: "2025-03-25",
    driveLink: "https://drive.google.com", youtubeLink: "https://youtube.com",
    notes: "Episódio piloto. Excelente qualidade de áudio.",
    history: [
      { user: "ana", action: "Episódio criado", date: "2025-03-10T10:00:00" },
      { user: "carlos", action: "Iniciada edição", date: "2025-03-12T14:30:00" },
      { user: "ana", action: "Aprovado para postagem", date: "2025-03-22T09:00:00" },
    ]
  },
  {
    id: "ep002", title: "OAB e a Reforma Tributária", number: 2,
    description: "Análise completa das mudanças tributárias e seus efeitos na advocacia.",
    status: "aprovacao", responsible: "carlos", guests: ["Dr. Fernando Lima"],
    recordingDate: "2025-03-18", deadlineEdit: "2025-03-28", deadlinePublish: "2025-04-02",
    driveLink: "https://drive.google.com", youtubeLink: "",
    notes: "Aguardando revisão final do apresentador.",
    history: [
      { user: "lucia", action: "Episódio criado", date: "2025-03-18T11:00:00" },
      { user: "carlos", action: "Edição concluída", date: "2025-03-25T16:00:00" },
    ]
  },
  {
    id: "ep003", title: "Advocacia Criminal: Desafios Atuais", number: 3,
    description: "Especialistas debatem o sistema penal e as garantias do réu.",
    status: "edicao", responsible: "carlos", guests: ["Dra. Renata Alves","Dr. Thiago Costa"],
    recordingDate: "2025-03-25", deadlineEdit: "2025-04-04", deadlinePublish: "2025-04-10",
    driveLink: "https://drive.google.com", youtubeLink: "",
    notes: "",
    history: [
      { user: "ana", action: "Episódio criado", date: "2025-03-25T09:30:00" },
    ]
  },
  {
    id: "ep004", title: "Ética na Advocacia Contemporânea", number: 4,
    description: "A ética profissional como pilar da advocacia moderna.",
    status: "gravado", responsible: "lucia", guests: ["Dr. Armando Pires"],
    recordingDate: "2025-04-01", deadlineEdit: "2025-04-08", deadlinePublish: "2025-04-15",
    driveLink: "", youtubeLink: "",
    notes: "Arquivos brutos ainda não enviados ao editor.",
    history: [
      { user: "lucia", action: "Episódio criado", date: "2025-04-01T08:00:00" },
    ]
  },
  {
    id: "ep005", title: "Direito de Família: Novas Perspectivas", number: 5,
    description: "Mudanças recentes no direito de família e impactos práticos.",
    status: "pronto", responsible: "ana", guests: ["Dra. Camila Nunes","Dr. João Victor"],
    recordingDate: "2025-03-22", deadlineEdit: "2025-04-01", deadlinePublish: "2025-04-06",
    driveLink: "https://drive.google.com", youtubeLink: "",
    notes: "Pronto! Apenas aguardando slot de publicação.",
    history: [
      { user: "ana", action: "Episódio criado", date: "2025-03-22T10:00:00" },
      { user: "carlos", action: "Edição finalizada", date: "2025-03-30T17:00:00" },
      { user: "ana", action: "Aprovado", date: "2025-04-01T10:00:00" },
    ]
  },
];

function daysDiff(dateStr) {
  if (!dateStr) return null;
  const now = new Date(); now.setHours(0,0,0,0);
  const d = new Date(dateStr); d.setHours(0,0,0,0);
  return Math.ceil((d - now) / 86400000);
}

function fmt(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("pt-BR");
}

function fmtTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR") + " " + d.toLocaleTimeString("pt-BR", {hour:"2-digit",minute:"2-digit"});
}

export default function App() {
  const [episodes, setEpisodes] = useState(INITIAL_EPISODES);
  const [view, setView] = useState("dashboard");
  const [currentUser] = useState(USERS[0]);
  const [modal, setModal] = useState(null); // null | { type: "create" | "edit" | "detail", ep? }
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterResp, setFilterResp] = useState("all");
  const [dragInfo, setDragInfo] = useState(null);
  const [search, setSearch] = useState("");
  const [notification, setNotification] = useState(null);

  const notify = (msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const saveEpisode = (ep) => {
    setEpisodes(prev => {
      const exists = prev.find(e => e.id === ep.id);
      if (exists) return prev.map(e => e.id === ep.id ? ep : e);
      return [...prev, ep];
    });
    setModal(null);
    notify(ep.id ? "Episódio atualizado!" : "Episódio criado!");
  };

  const deleteEpisode = (id) => {
    setEpisodes(prev => prev.filter(e => e.id !== id));
    setModal(null);
    notify("Episódio removido.", "warning");
  };

  const updateStatus = (id, status) => {
    setEpisodes(prev => prev.map(e => {
      if (e.id !== id) return e;
      return {
        ...e, status,
        history: [...e.history, {
          user: currentUser.id,
          action: `Status alterado para: ${STATUS_CONFIG[status].label}`,
          date: new Date().toISOString()
        }]
      };
    }));
    notify(`Status atualizado: ${STATUS_CONFIG[status].label}`);
  };

  // Drag & drop kanban
  const handleDrop = (targetStatus) => {
    if (!dragInfo) return;
    updateStatus(dragInfo, targetStatus);
    setDragInfo(null);
  };

  const filtered = episodes.filter(e => {
    if (filterStatus !== "all" && e.status !== filterStatus) return false;
    if (filterResp !== "all" && e.responsible !== filterResp) return false;
    if (search && !e.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const stats = {
    total: episodes.length,
    byStatus: STATUS_ORDER.reduce((a, s) => ({ ...a, [s]: episodes.filter(e => e.status === s).length }), {}),
    late: episodes.filter(e => {
      const d = daysDiff(e.deadlinePublish);
      return d !== null && d < 0 && e.status !== "youtube" && e.status !== "tv";
    }).length,
  };

  return (
    <>
      <style>{FONTS}</style>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0A0F1F; color: #EAEAEA; font-family: 'Rajdhani', sans-serif; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #0D1426; }
        ::-webkit-scrollbar-thumb { background: #00D4FF44; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #00D4FF88; }

        .glow-blue { box-shadow: 0 0 12px #00D4FF55, 0 0 24px #00D4FF22; }
        .glow-red  { box-shadow: 0 0 12px #FF003C55, 0 0 24px #FF003C22; }
        .glow-text { text-shadow: 0 0 10px #00D4FF99; }
        .glow-text-red { text-shadow: 0 0 10px #FF003C99; }

        .nav-btn {
          background: transparent; border: none; color: #7A8EAA;
          font-family: 'Rajdhani', sans-serif; font-size: 14px; font-weight: 600;
          letter-spacing: 1px; padding: 10px 18px; cursor: pointer;
          border-radius: 6px; transition: all 0.2s; text-transform: uppercase;
          display: flex; align-items: center; gap: 8px;
        }
        .nav-btn:hover { color: #00D4FF; background: rgba(0,212,255,0.08); }
        .nav-btn.active {
          color: #00D4FF; background: rgba(0,212,255,0.12);
          border-bottom: 2px solid #00D4FF;
          text-shadow: 0 0 8px #00D4FF88;
        }

        .btn-primary {
          background: linear-gradient(135deg, #00D4FF22, #00D4FF11);
          border: 1px solid #00D4FF66;
          color: #00D4FF; padding: 10px 20px; border-radius: 8px;
          font-family: 'Rajdhani', sans-serif; font-weight: 700;
          font-size: 13px; letter-spacing: 1px; cursor: pointer;
          transition: all 0.2s; text-transform: uppercase;
          display: inline-flex; align-items: center; gap: 8px;
        }
        .btn-primary:hover { background: rgba(0,212,255,0.25); box-shadow: 0 0 16px #00D4FF44; }

        .btn-danger {
          background: rgba(255,0,60,0.1); border: 1px solid #FF003C66;
          color: #FF003C; padding: 8px 16px; border-radius: 8px;
          font-family: 'Rajdhani', sans-serif; font-weight: 700;
          font-size: 12px; letter-spacing: 1px; cursor: pointer;
          transition: all 0.2s; text-transform: uppercase;
        }
        .btn-danger:hover { background: rgba(255,0,60,0.2); box-shadow: 0 0 12px #FF003C44; }

        .card {
          background: linear-gradient(135deg, #0D1426, #101828);
          border: 1px solid #1E2D45;
          border-radius: 12px; padding: 20px;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .card:hover { border-color: #00D4FF33; box-shadow: 0 0 20px #00D4FF11; }

        .ep-card {
          background: linear-gradient(135deg, #0D1426ee, #0F1B30ee);
          border: 1px solid #1E2D45;
          border-radius: 10px; padding: 14px;
          cursor: pointer; transition: all 0.2s;
          position: relative; overflow: hidden;
        }
        .ep-card::before {
          content: ''; position: absolute; top: 0; left: 0;
          width: 3px; height: 100%;
          background: var(--status-color, #00D4FF);
          box-shadow: 0 0 8px var(--status-color, #00D4FF);
        }
        .ep-card:hover { border-color: #00D4FF44; box-shadow: 0 0 16px #00D4FF11; transform: translateY(-1px); }
        .ep-card.dragging { opacity: 0.5; transform: scale(0.97); }

        .kanban-col {
          min-height: 200px; border-radius: 10px;
          border: 1px solid #1E2D45;
          background: rgba(13,20,38,0.6);
          transition: all 0.2s;
          padding: 12px;
        }
        .kanban-col.drag-over {
          border-color: #00D4FF66;
          background: rgba(0,212,255,0.06);
          box-shadow: inset 0 0 20px #00D4FF11;
        }

        .stat-card {
          background: linear-gradient(135deg, #0D1426, #101828);
          border: 1px solid #1E2D45;
          border-radius: 12px; padding: 22px;
          position: relative; overflow: hidden;
          transition: all 0.3s;
        }
        .stat-card::after {
          content: ''; position: absolute; bottom: -20px; right: -20px;
          width: 80px; height: 80px; border-radius: 50%;
          background: var(--accent, #00D4FF);
          opacity: 0.04; filter: blur(20px);
        }
        .stat-card:hover { border-color: var(--accent, #00D4FF); box-shadow: 0 0 20px rgba(0,212,255,0.1); }

        .tag {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 3px 10px; border-radius: 20px;
          font-size: 11px; font-weight: 700; letter-spacing: 0.5px;
          text-transform: uppercase;
        }

        input, textarea, select {
          background: rgba(0,212,255,0.05);
          border: 1px solid #1E2D45; border-radius: 8px;
          color: #EAEAEA; font-family: 'Rajdhani', sans-serif;
          font-size: 14px; padding: 10px 14px; width: 100%;
          transition: all 0.2s; outline: none;
        }
        input:focus, textarea:focus, select:focus {
          border-color: #00D4FF55; box-shadow: 0 0 0 2px rgba(0,212,255,0.1);
        }
        select option { background: #0D1426; }
        label { font-size: 12px; font-weight: 700; letter-spacing: 1px; color: #7A8EAA; text-transform: uppercase; margin-bottom: 6px; display: block; }

        .overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.85);
          backdrop-filter: blur(4px); z-index: 100;
          display: flex; align-items: center; justify-content: center;
          padding: 20px;
        }
        .modal {
          background: linear-gradient(135deg, #0D1426, #0F1B30);
          border: 1px solid #00D4FF33; border-radius: 16px;
          width: 100%; max-width: 700px; max-height: 90vh;
          overflow-y: auto; padding: 28px;
          box-shadow: 0 0 40px rgba(0,212,255,0.15);
        }

        .progress-bar {
          height: 4px; background: #1E2D45; border-radius: 2px; overflow: hidden;
        }
        .progress-bar-fill {
          height: 100%; border-radius: 2px; transition: width 0.5s ease;
        }

        .orb-title {
          font-family: 'Orbitron', monospace;
          font-weight: 900; letter-spacing: 2px;
        }

        .notification {
          position: fixed; bottom: 24px; right: 24px; z-index: 999;
          padding: 14px 24px; border-radius: 10px;
          font-family: 'Rajdhani', sans-serif; font-weight: 700;
          font-size: 14px; letter-spacing: 0.5px;
          animation: slideIn 0.3s ease;
        }
        @keyframes slideIn { from { opacity: 0; transform: translateX(50px); } to { opacity: 1; transform: translateX(0); } }

        .grid-dash { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; }
        .kanban-wrap { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; align-items: start; }
        .ep-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }

        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.6; } }
        .pulse { animation: pulse 2s infinite; }

        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        .scanline {
          position: fixed; top: 0; left: 0; right: 0; height: 2px;
          background: linear-gradient(transparent, #00D4FF22, transparent);
          animation: scanline 8s linear infinite; pointer-events: none; z-index: 0;
        }
      `}</style>

      <div className="scanline" />

      {/* NOTIFICATION */}
      {notification && (
        <div className="notification" style={{
          background: notification.type === "warning" ? "rgba(255,0,60,0.15)" : "rgba(0,212,255,0.15)",
          border: `1px solid ${notification.type === "warning" ? "#FF003C66" : "#00D4FF66"}`,
          color: notification.type === "warning" ? "#FF003C" : "#00D4FF",
        }}>
          {notification.type === "warning" ? "⚠️" : "✓"} {notification.msg}
        </div>
      )}

      {/* HEADER */}
      <header style={{
        background: "linear-gradient(180deg, #080D1A, #0A0F1F)",
        borderBottom: "1px solid #1E2D45",
        padding: "0 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: 64, position: "sticky", top: 0, zIndex: 50,
        boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8,
              background: "linear-gradient(135deg, #00D4FF22, #7B61FF22)",
              border: "1px solid #00D4FF44",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18,
            }}>🎙️</div>
            <div>
              <div className="orb-title" style={{ fontSize: 13, color: "#00D4FF" }} >OAB-PI</div>
              <div style={{ fontSize: 10, color: "#4A5A70", letterSpacing: 2, textTransform: "uppercase" }}>PODCAST STUDIO</div>
            </div>
          </div>
          <nav style={{ display: "flex", gap: 4, marginLeft: 16 }}>
            {[
              ["dashboard", "📊", "Dashboard"],
              ["kanban", "📋", "Kanban"],
              ["episodes", "🎙️", "Episódios"],
            ].map(([v, icon, label]) => (
              <button key={v} className={`nav-btn ${view === v ? "active" : ""}`} onClick={() => setView(v)}>
                <span>{icon}</span>{label}
              </button>
            ))}
          </nav>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {stats.late > 0 && (
            <div className="pulse" style={{
              padding: "4px 12px", borderRadius: 20, background: "rgba(255,0,60,0.15)",
              border: "1px solid #FF003C66", color: "#FF003C",
              fontSize: 12, fontWeight: 700,
            }}>
              ⚠️ {stats.late} atrasado{stats.late > 1 ? "s" : ""}
            </div>
          )}
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "6px 12px", borderRadius: 20,
            background: "rgba(0,212,255,0.08)", border: "1px solid #00D4FF22",
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%",
              background: "linear-gradient(135deg, #00D4FF, #7B61FF)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 900, color: "#0A0F1F",
            }}>{currentUser.avatar}</div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#EAEAEA" }}>{currentUser.name}</div>
              <div style={{ fontSize: 10, color: "#00D4FF", textTransform: "uppercase", letterSpacing: 1 }}>{currentUser.role}</div>
            </div>
          </div>
        </div>
      </header>

      <main style={{ padding: "28px 24px", maxWidth: 1400, margin: "0 auto" }}>
        {view === "dashboard" && <Dashboard episodes={episodes} stats={stats} setView={setView} setModal={setModal} />}
        {view === "kanban" && <KanbanView episodes={filtered} stats={stats} filterStatus={filterStatus} setFilterStatus={setFilterStatus} filterResp={filterResp} setFilterResp={setFilterResp} search={search} setSearch={setSearch} onDragStart={setDragInfo} onDrop={handleDrop} dragInfo={dragInfo} onOpenEp={(ep) => setModal({ type: "detail", ep })} setModal={setModal} />}
        {view === "episodes" && <EpisodesView episodes={filtered} filterStatus={filterStatus} setFilterStatus={setFilterStatus} filterResp={filterResp} setFilterResp={setFilterResp} search={search} setSearch={setSearch} onOpenEp={(ep) => setModal({ type: "detail", ep })} setModal={setModal} />}
      </main>

      {modal && (
        <div className="overlay" onClick={(e) => { if (e.target === e.currentTarget) setModal(null); }}>
          {modal.type === "detail" && <DetailModal ep={modal.ep} episodes={episodes} onClose={() => setModal(null)} onEdit={() => setModal({ type: "edit", ep: modal.ep })} onDelete={deleteEpisode} onStatusChange={updateStatus} />}
          {(modal.type === "create" || modal.type === "edit") && <EpisodeFormModal ep={modal.ep} onClose={() => setModal(null)} onSave={saveEpisode} currentUser={currentUser} />}
        </div>
      )}
    </>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ episodes, stats, setView, setModal }) {
  const progress = Math.round((stats.byStatus.youtube + stats.byStatus.tv) / Math.max(stats.total, 1) * 100);
  const upcoming = episodes
    .filter(e => e.deadlinePublish && e.status !== "youtube" && e.status !== "tv")
    .sort((a,b) => new Date(a.deadlinePublish) - new Date(b.deadlinePublish))
    .slice(0, 5);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      {/* HERO */}
      <div style={{
        background: "linear-gradient(135deg, #0D1426, #0F1B30)",
        border: "1px solid #1E2D45", borderRadius: 16, padding: "28px 32px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", top: -60, right: -60, width: 300, height: 300,
          borderRadius: "50%", background: "radial-gradient(#00D4FF08, transparent 70%)",
        }} />
        <div>
          <div style={{ fontSize: 12, color: "#4A5A70", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>CENTRO DE CONTROLE</div>
          <div className="orb-title" style={{ fontSize: 28, color: "#EAEAEA", marginBottom: 8 }}>
            Studio <span style={{ color: "#00D4FF" }} className="glow-text">OAB-PI</span>
          </div>
          <div style={{ fontSize: 15, color: "#7A8EAA", maxWidth: 400 }}>
            Gestão completa de produção de podcast institucional
          </div>
          <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
            <div className="progress-bar" style={{ width: 200 }}>
              <div className="progress-bar-fill" style={{ width: `${progress}%`, background: "linear-gradient(90deg, #00D4FF, #7B61FF)" }} />
            </div>
            <span style={{ fontSize: 12, color: "#00D4FF", fontWeight: 700 }}>{progress}% publicados</span>
          </div>
        </div>
        <button className="btn-primary" onClick={() => setModal({ type: "create" })} style={{ fontSize: 15, padding: "12px 28px" }}>
          + Novo Episódio
        </button>
      </div>

      {/* STAT CARDS */}
      <div className="grid-dash">
        <StatCard icon="🎙️" label="Total" value={stats.total} accent="#00D4FF" />
        <StatCard icon="✂️" label="Em Edição" value={stats.byStatus.edicao} accent="#00D4FF" />
        <StatCard icon="⏳" label="Aguard. Aprovação" value={stats.byStatus.aprovacao} accent="#FFD600" />
        <StatCard icon="📤" label="Prontos" value={stats.byStatus.pronto} accent="#00FF94" />
        <StatCard icon="▶️" label="No YouTube" value={stats.byStatus.youtube} accent="#FF003C" />
        <StatCard icon="⚠️" label="Atrasados" value={stats.late} accent="#FF003C" danger={stats.late > 0} />
      </div>

      {/* STATUS BREAKDOWN + UPCOMING */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Status breakdown */}
        <div className="card">
          <div className="orb-title" style={{ fontSize: 13, color: "#7A8EAA", marginBottom: 16, letterSpacing: 1 }}>STATUS DO FLUXO</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {STATUS_ORDER.map(s => {
              const count = stats.byStatus[s] || 0;
              const pct = Math.round(count / Math.max(stats.total, 1) * 100);
              const cfg = STATUS_CONFIG[s];
              return (
                <div key={s}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 13, color: "#EAEAEA" }}>{cfg.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: cfg.color }}>{count}</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-bar-fill" style={{ width: `${pct}%`, background: cfg.color, boxShadow: `0 0 6px ${cfg.color}66` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming deadlines */}
        <div className="card">
          <div className="orb-title" style={{ fontSize: 13, color: "#7A8EAA", marginBottom: 16, letterSpacing: 1 }}>PRÓXIMOS PRAZOS</div>
          {upcoming.length === 0 && <div style={{ color: "#4A5A70", fontSize: 13 }}>Nenhum prazo pendente.</div>}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {upcoming.map(ep => {
              const diff = daysDiff(ep.deadlinePublish);
              const isLate = diff !== null && diff < 0;
              const isUrgent = diff !== null && diff >= 0 && diff <= 3;
              return (
                <div key={ep.id} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "10px 14px", borderRadius: 8,
                  background: isLate ? "rgba(255,0,60,0.08)" : "rgba(0,212,255,0.05)",
                  border: `1px solid ${isLate ? "#FF003C33" : "#1E2D45"}`,
                }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>Ep.{ep.number} — {ep.title.slice(0, 28)}{ep.title.length > 28 ? "…" : ""}</div>
                    <div style={{ fontSize: 11, color: "#7A8EAA", marginTop: 2 }}>
                      {STATUS_CONFIG[ep.status]?.label}
                    </div>
                  </div>
                  <div style={{
                    fontSize: 12, fontWeight: 900,
                    color: isLate ? "#FF003C" : isUrgent ? "#FFD600" : "#00FF94",
                    textAlign: "right",
                  }}>
                    {isLate ? `${Math.abs(diff)}d atraso` : diff === 0 ? "Hoje!" : `${diff}d`}
                    <div style={{ fontSize: 10, color: "#4A5A70", fontWeight: 400 }}>{fmt(ep.deadlinePublish)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ display: "flex", gap: 12 }}>
        <button className="btn-primary" onClick={() => setView("kanban")}>📋 Ver Kanban</button>
        <button className="btn-primary" onClick={() => setView("episodes")}>🎙️ Ver Todos os Episódios</button>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, accent, danger }) {
  return (
    <div className="stat-card" style={{ "--accent": accent }}>
      <div style={{ fontSize: 22, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 32, fontWeight: 900, fontFamily: "Orbitron, monospace", color: danger && value > 0 ? "#FF003C" : accent, textShadow: `0 0 12px ${accent}66` }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: "#7A8EAA", letterSpacing: 1, textTransform: "uppercase", marginTop: 4 }}>{label}</div>
    </div>
  );
}

// ─── KANBAN ───────────────────────────────────────────────────────────────────
function KanbanView({ episodes, filterStatus, setFilterStatus, filterResp, setFilterResp, search, setSearch, onDragStart, onDrop, dragInfo, onOpenEp, setModal }) {
  const [dragOver, setDragOver] = useState(null);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div className="orb-title" style={{ fontSize: 20, color: "#EAEAEA" }}>
          KANBAN <span style={{ color: "#00D4FF" }}>BOARD</span>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <FilterBar filterResp={filterResp} setFilterResp={setFilterResp} search={search} setSearch={setSearch} />
          <button className="btn-primary" onClick={() => setModal({ type: "create" })}>+ Novo</button>
        </div>
      </div>
      <div style={{ overflowX: "auto", paddingBottom: 16 }}>
        <div style={{ display: "flex", gap: 12, minWidth: 1200 }}>
          {STATUS_ORDER.map(s => {
            const cfg = STATUS_CONFIG[s];
            const cols = episodes.filter(e => e.status === s);
            return (
              <div key={s} style={{ flex: "0 0 210px" }}>
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  marginBottom: 10, padding: "6px 10px", borderRadius: 6,
                  background: cfg.bg, border: `1px solid ${cfg.color}33`,
                }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: cfg.color, letterSpacing: 0.5 }}>{cfg.label}</span>
                  <span style={{
                    background: cfg.color + "22", color: cfg.color,
                    borderRadius: "50%", width: 20, height: 20,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 900,
                  }}>{cols.length}</span>
                </div>
                <div
                  className={`kanban-col ${dragOver === s ? "drag-over" : ""}`}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(s); }}
                  onDragLeave={() => setDragOver(null)}
                  onDrop={() => { onDrop(s); setDragOver(null); }}
                  style={{ minHeight: 180 }}
                >
                  {cols.map(ep => (
                    <KanbanCard key={ep.id} ep={ep} onDragStart={() => onDragStart(ep.id)} onClick={() => onOpenEp(ep)} isDragging={dragInfo === ep.id} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function KanbanCard({ ep, onDragStart, onClick, isDragging }) {
  const cfg = STATUS_CONFIG[ep.status];
  const diff = daysDiff(ep.deadlinePublish);
  const isLate = diff !== null && diff < 0;
  const resp = USERS.find(u => u.id === ep.responsible);

  return (
    <div
      className={`ep-card ${isDragging ? "dragging" : ""}`}
      style={{ "--status-color": cfg.color, marginBottom: 8 }}
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
    >
      <div style={{ fontSize: 10, color: "#4A5A70", marginBottom: 4, letterSpacing: 1 }}>EP.{String(ep.number).padStart(2,"0")}</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#EAEAEA", marginBottom: 8, lineHeight: 1.3 }}>
        {ep.title.slice(0, 40)}{ep.title.length > 40 ? "…" : ""}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{
          width: 22, height: 22, borderRadius: "50%",
          background: `linear-gradient(135deg, ${cfg.color}, #7B61FF)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 9, fontWeight: 900, color: "#0A0F1F",
        }}>{resp?.avatar || "??"}</div>
        {ep.deadlinePublish && (
          <div style={{ fontSize: 10, color: isLate ? "#FF003C" : "#7A8EAA", fontWeight: isLate ? 700 : 400 }}>
            {isLate ? `⚠️ ${Math.abs(diff)}d` : `📅 ${fmt(ep.deadlinePublish)}`}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── EPISODES LIST ────────────────────────────────────────────────────────────
function EpisodesView({ episodes, filterStatus, setFilterStatus, filterResp, setFilterResp, search, setSearch, onOpenEp, setModal }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div className="orb-title" style={{ fontSize: 20, color: "#EAEAEA" }}>
          EPISÓDIOS <span style={{ color: "#00D4FF" }}>({episodes.length})</span>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width: 200 }}>
            <option value="all">Todos os status</option>
            {STATUS_ORDER.map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
          </select>
          <FilterBar filterResp={filterResp} setFilterResp={setFilterResp} search={search} setSearch={setSearch} />
          <button className="btn-primary" onClick={() => setModal({ type: "create" })}>+ Novo</button>
        </div>
      </div>
      <div className="ep-grid">
        {episodes.map(ep => <EpisodeCard key={ep.id} ep={ep} onClick={() => onOpenEp(ep)} />)}
      </div>
      {episodes.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "#4A5A70" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎙️</div>
          <div className="orb-title" style={{ fontSize: 16 }}>Nenhum episódio encontrado</div>
        </div>
      )}
    </div>
  );
}

function EpisodeCard({ ep, onClick }) {
  const cfg = STATUS_CONFIG[ep.status];
  const diff = daysDiff(ep.deadlinePublish);
  const isLate = diff !== null && diff < 0 && ep.status !== "youtube" && ep.status !== "tv";
  const resp = USERS.find(u => u.id === ep.responsible);

  return (
    <div className="ep-card" style={{ "--status-color": cfg.color }} onClick={onClick}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div>
          <span style={{ fontSize: 10, color: "#4A5A70", letterSpacing: 1 }}>EP.{String(ep.number).padStart(2,"0")}</span>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#EAEAEA", marginTop: 2 }}>{ep.title}</div>
        </div>
        <span className="tag" style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}33`, whiteSpace: "nowrap", marginLeft: 8 }}>
          {cfg.label}
        </span>
      </div>
      <div style={{ fontSize: 12, color: "#7A8EAA", marginBottom: 12, lineHeight: 1.5 }}>
        {ep.description.slice(0, 90)}{ep.description.length > 90 ? "…" : ""}
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
        {ep.guests?.slice(0,2).map((g, i) => (
          <span key={i} className="tag" style={{ background: "rgba(123,97,255,0.1)", color: "#7B61FF", border: "1px solid #7B61FF33" }}>
            👤 {g}
          </span>
        ))}
        {(ep.guests?.length || 0) > 2 && (
          <span className="tag" style={{ background: "rgba(123,97,255,0.1)", color: "#7B61FF", border: "1px solid #7B61FF33" }}>
            +{ep.guests.length - 2}
          </span>
        )}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8, paddingTop: 10, borderTop: "1px solid #1E2D45" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{
            width: 22, height: 22, borderRadius: "50%",
            background: `linear-gradient(135deg, ${cfg.color}, #7B61FF)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 9, fontWeight: 900, color: "#0A0F1F",
          }}>{resp?.avatar}</div>
          <span style={{ fontSize: 12, color: "#7A8EAA" }}>{resp?.name}</span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {ep.deadlinePublish && (
            <span style={{ fontSize: 11, color: isLate ? "#FF003C" : "#7A8EAA", fontWeight: isLate ? 700 : 400 }}>
              {isLate ? `⚠️ ${Math.abs(diff)}d atraso` : `📅 ${fmt(ep.deadlinePublish)}`}
            </span>
          )}
          {ep.youtubeLink && <span style={{ fontSize: 12 }}>▶️</span>}
          {ep.driveLink && <span style={{ fontSize: 12 }}>☁️</span>}
        </div>
      </div>
    </div>
  );
}

// ─── DETAIL MODAL ─────────────────────────────────────────────────────────────
function DetailModal({ ep, episodes, onClose, onEdit, onDelete, onStatusChange }) {
  const cfg = STATUS_CONFIG[ep.status];
  const diff = daysDiff(ep.deadlinePublish);
  const isLate = diff !== null && diff < 0 && ep.status !== "youtube" && ep.status !== "tv";
  const resp = USERS.find(u => u.id === ep.responsible);

  return (
    <div className="modal" style={{ maxWidth: 760 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 10, color: "#4A5A70", letterSpacing: 2, textTransform: "uppercase" }}>EPISÓDIO {String(ep.number).padStart(2,"0")}</div>
          <div className="orb-title" style={{ fontSize: 22, color: "#EAEAEA", marginTop: 4 }}>{ep.title}</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn-primary" onClick={onEdit}>✏️ Editar</button>
          <button className="btn-danger" onClick={() => { if (confirm("Remover este episódio?")) onDelete(ep.id); }}>🗑️</button>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "#7A8EAA", cursor: "pointer", fontSize: 18 }}>✕</button>
        </div>
      </div>

      {/* Status selector */}
      <div style={{ marginBottom: 20 }}>
        <label>Alterar Status</label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
          {STATUS_ORDER.map(s => {
            const c = STATUS_CONFIG[s];
            return (
              <button key={s} onClick={() => onStatusChange(ep.id, s)} style={{
                padding: "6px 12px", borderRadius: 6, cursor: "pointer",
                background: ep.status === s ? c.bg : "transparent",
                border: `1px solid ${ep.status === s ? c.color : "#1E2D45"}`,
                color: ep.status === s ? c.color : "#7A8EAA",
                fontSize: 12, fontWeight: 700, fontFamily: "Rajdhani, sans-serif",
                transition: "all 0.2s",
              }}>
                {c.label}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        <InfoBox label="Responsável" value={resp?.name || ep.responsible} />
        <InfoBox label="Gravação" value={fmt(ep.recordingDate)} />
        <InfoBox label="Prazo Edição" value={fmt(ep.deadlineEdit)} />
        <InfoBox label="Prazo Publicação" value={
          <span style={{ color: isLate ? "#FF003C" : "#EAEAEA" }}>
            {fmt(ep.deadlinePublish)} {isLate ? `(⚠️ ${Math.abs(diff)}d de atraso)` : diff !== null && diff <= 3 ? `(${diff}d)` : ""}
          </span>
        } />
      </div>

      {ep.description && (
        <div style={{ marginBottom: 20 }}>
          <label>Descrição</label>
          <div style={{ fontSize: 14, color: "#EAEAEA", lineHeight: 1.6 }}>{ep.description}</div>
        </div>
      )}

      {ep.guests?.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <label>Participantes</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
            {ep.guests.map((g, i) => (
              <span key={i} className="tag" style={{ background: "rgba(123,97,255,0.1)", color: "#7B61FF", border: "1px solid #7B61FF33" }}>👤 {g}</span>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        {ep.driveLink && <a href={ep.driveLink} target="_blank" rel="noreferrer" className="btn-primary" style={{ textDecoration: "none" }}>☁️ Google Drive</a>}
        {ep.youtubeLink && <a href={ep.youtubeLink} target="_blank" rel="noreferrer" className="btn-primary" style={{ textDecoration: "none" }}>▶️ YouTube</a>}
      </div>

      {ep.notes && (
        <div style={{ marginBottom: 20, padding: "12px 16px", background: "rgba(255,214,0,0.06)", border: "1px solid #FFD60033", borderRadius: 8 }}>
          <label style={{ color: "#FFD600" }}>Observações</label>
          <div style={{ fontSize: 13, color: "#EAEAEA", marginTop: 6, lineHeight: 1.5 }}>{ep.notes}</div>
        </div>
      )}

      {/* Timeline */}
      <div>
        <label>Histórico</label>
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
          {[...ep.history].reverse().map((h, i) => {
            const u = USERS.find(u => u.id === h.user);
            return (
              <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                  background: "linear-gradient(135deg, #00D4FF, #7B61FF)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, fontWeight: 900, color: "#0A0F1F",
                }}>{u?.avatar || "??"}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: "#EAEAEA" }}>{h.action}</div>
                  <div style={{ fontSize: 11, color: "#4A5A70", marginTop: 2 }}>{u?.name} · {fmtTime(h.date)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function InfoBox({ label, value }) {
  return (
    <div style={{ padding: "10px 14px", background: "rgba(0,212,255,0.04)", border: "1px solid #1E2D45", borderRadius: 8 }}>
      <div style={{ fontSize: 10, color: "#4A5A70", letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: "#EAEAEA" }}>{value}</div>
    </div>
  );
}

// ─── FORM MODAL ───────────────────────────────────────────────────────────────
function EpisodeFormModal({ ep, onClose, onSave, currentUser }) {
  const isEdit = !!ep?.id;
  const [form, setForm] = useState(() => ep ? { ...ep, guests: ep.guests?.join(", ") || "" } : {
    title: "", number: "", description: "", status: "gravado",
    responsible: currentUser.id, guests: "",
    recordingDate: "", deadlineEdit: "", deadlinePublish: "",
    driveLink: "", youtubeLink: "", notes: "",
    history: [],
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const submit = () => {
    if (!form.title.trim()) return alert("Título obrigatório!");
    const guests = form.guests.split(",").map(s => s.trim()).filter(Boolean);
    const id = ep?.id || `ep${Date.now()}`;
    const history = isEdit ? (ep.history || []) : [{ user: currentUser.id, action: "Episódio criado", date: new Date().toISOString() }];
    if (isEdit && form.status !== ep.status) {
      history.push({ user: currentUser.id, action: `Status alterado para: ${STATUS_CONFIG[form.status].label}`, date: new Date().toISOString() });
    }
    onSave({ ...form, id, guests, history, number: Number(form.number) || 0 });
  };

  return (
    <div className="modal">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div className="orb-title" style={{ fontSize: 18, color: "#EAEAEA" }}>
          {isEdit ? "✏️ EDITAR" : "＋ NOVO"} <span style={{ color: "#00D4FF" }}>EPISÓDIO</span>
        </div>
        <button onClick={onClose} style={{ background: "transparent", border: "none", color: "#7A8EAA", cursor: "pointer", fontSize: 20 }}>✕</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ gridColumn: "1/-1" }}>
          <label>Título *</label>
          <input value={form.title} onChange={e => set("title", e.target.value)} placeholder="Ex: Direito Digital no Século XXI" />
        </div>
        <div>
          <label>Número</label>
          <input type="number" value={form.number} onChange={e => set("number", e.target.value)} placeholder="1" />
        </div>
        <div>
          <label>Status</label>
          <select value={form.status} onChange={e => set("status", e.target.value)}>
            {STATUS_ORDER.map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
          </select>
        </div>
        <div>
          <label>Responsável</label>
          <select value={form.responsible} onChange={e => set("responsible", e.target.value)}>
            {USERS.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
          </select>
        </div>
        <div>
          <label>Data de Gravação</label>
          <input type="date" value={form.recordingDate} onChange={e => set("recordingDate", e.target.value)} />
        </div>
        <div>
          <label>Prazo de Edição</label>
          <input type="date" value={form.deadlineEdit} onChange={e => set("deadlineEdit", e.target.value)} />
        </div>
        <div>
          <label>Prazo de Publicação</label>
          <input type="date" value={form.deadlinePublish} onChange={e => set("deadlinePublish", e.target.value)} />
        </div>
        <div style={{ gridColumn: "1/-1" }}>
          <label>Participantes / Convidados (separados por vírgula)</label>
          <input value={form.guests} onChange={e => set("guests", e.target.value)} placeholder="Dr. Paulo Salave'a, Dra. Marina Sousa" />
        </div>
        <div style={{ gridColumn: "1/-1" }}>
          <label>Descrição</label>
          <textarea rows={3} value={form.description} onChange={e => set("description", e.target.value)} placeholder="Breve descrição do episódio..." style={{ resize: "vertical" }} />
        </div>
        <div>
          <label>🔗 Link Google Drive</label>
          <input value={form.driveLink} onChange={e => set("driveLink", e.target.value)} placeholder="https://drive.google.com/..." />
        </div>
        <div>
          <label>▶️ Link YouTube</label>
          <input value={form.youtubeLink} onChange={e => set("youtubeLink", e.target.value)} placeholder="https://youtube.com/..." />
        </div>
        <div style={{ gridColumn: "1/-1" }}>
          <label>Observações</label>
          <textarea rows={2} value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Notas internas..." style={{ resize: "vertical" }} />
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 24, justifyContent: "flex-end" }}>
        <button onClick={onClose} style={{ padding: "10px 20px", background: "transparent", border: "1px solid #1E2D45", borderRadius: 8, color: "#7A8EAA", cursor: "pointer", fontFamily: "Rajdhani, sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: 1, textTransform: "uppercase" }}>
          Cancelar
        </button>
        <button className="btn-primary" onClick={submit} style={{ fontSize: 14, padding: "10px 28px" }}>
          {isEdit ? "💾 Salvar" : "✨ Criar Episódio"}
        </button>
      </div>
    </div>
  );
}

// ─── FILTER BAR ───────────────────────────────────────────────────────────────
function FilterBar({ filterResp, setFilterResp, search, setSearch }) {
  return (
    <>
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Buscar..." style={{ width: 180 }} />
      <select value={filterResp} onChange={e => setFilterResp(e.target.value)} style={{ width: 150 }}>
        <option value="all">Todos</option>
        {USERS.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
      </select>
    </>
  );
}
