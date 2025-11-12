
import React, { useEffect, useState } from "react";

const TARGET_PER_PERSON = 65;
const POOL_TARGET = 350;
const ORGANIZER_PASSWORD = "OsMelhores";
const MASTER_PASSWORD = "Muliru";

const initialData = {
  participants: [],
  products: [],
  organizers: ["murilo", "gabriel", "moises", "julia"],
};

function normalizeName(n) {
  return (n || "").trim().toLowerCase();
}
function firstName(n) {
  return normalizeName(n).split(" ")[0];
}

export default function App() {
  const [data, setData] = useState(() => {
    try {
      const raw = localStorage.getItem("piscinaapp:data");
      return raw ? JSON.parse(raw) : initialData;
    } catch (e) {
      return initialData;
    }
  });

  const [nameInput, setNameInput] = useState("");
  const [paidInput, setPaidInput] = useState("");
  const [prodName, setProdName] = useState("");
  const [prodPrice, setProdPrice] = useState("");

  const [showOrganizerPanel, setShowOrganizerPanel] = useState(false);
  const [authName, setAuthName] = useState("");
  const [authPwd, setAuthPwd] = useState("");
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [currentOrganizer, setCurrentOrganizer] = useState("");

  const [toast, setToast] = useState(null);
  const [newOrgName, setNewOrgName] = useState("");
  const [masterPwd, setMasterPwd] = useState("");

  useEffect(() => {
    try {
      localStorage.setItem("piscinaapp:data", JSON.stringify(data));
    } catch (e) {}
  }, [data]);

  const showToast = (text, type = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  const parseCurrency = (v) => {
    if (v === null || v === undefined || v === "") return NaN;
    const s = String(v).replace(/\s/g, "").replace(",", ".");
    return parseFloat(s);
  };

  const totalCollected = () => data.participants.reduce((s, p) => s + Number(p.paid || 0), 0);
  const remainingPool = () => Math.max(0, POOL_TARGET - totalCollected());
  const productsTotal = () => data.products.reduce((s, p) => s + Number(p.price || 0), 0);
  const poolReached = () => totalCollected() >= POOL_TARGET;

  const addParticipant = (e) => {
    e && e.preventDefault();
    const name = (nameInput || "").trim();
    const paid = parseCurrency(paidInput);
    if (!name || isNaN(paid)) {
      showToast("Nome ou valor inválido.", "error");
      return;
    }
    const newItem = { id: Date.now(), name, paid: Number(paid) };
    setData({ ...data, participants: [...data.participants, newItem] });
    setNameInput("");
    setPaidInput("");
    showToast("Participante cadastrado.");
  };

  const updateParticipantPaid = (id, paidStr) => {
    const paid = parseCurrency(paidStr);
    if (isNaN(paid)) {
      showToast("Valor inválido.", "error");
      return;
    }
    setData({ ...data, participants: data.participants.map((p) => (p.id === id ? { ...p, paid: Number(paid) } : p)) });
    showToast("Valor atualizado.");
  };

  const removeParticipant = (id) => {
    setData({ ...data, participants: data.participants.filter((p) => p.id !== id) });
    showToast("Participante removido.");
  };

  const addProduct = (e) => {
    e && e.preventDefault();
    if (!isOrganizer) {
      showToast("Somente organizadores podem alterar a lista.", "error");
      return;
    }
    const name = (prodName || "").trim();
    const price = parseCurrency(prodPrice);
    if (!name || isNaN(price)) {
      showToast("Produto ou preço inválido.", "error");
      return;
    }
    const newItem = { id: Date.now(), name, price: Number(price) };
    setData({ ...data, products: [...data.products, newItem] });
    setProdName("");
    setProdPrice("");
    showToast("Produto adicionado.");
  };

  const editProduct = (id) => {
    if (!isOrganizer) return showToast("Somente organizadores podem editar.", "error");
    const prod = data.products.find((p) => p.id === id);
    if (!prod) return;
    const name = prompt("Nome do produto:", prod.name);
    const price = prompt("Preço (R$):", String(prod.price));
    if (name === null || price === null) return;
    const priceNum = parseCurrency(price);
    if (!name.trim() || isNaN(priceNum)) return showToast("Nome ou preço inválido.", "error");
    setData({
      ...data,
      products: data.products.map((p) => (p.id === id ? { ...p, name: name.trim(), price: Number(priceNum) } : p)),
    });
    showToast("Produto atualizado.");
  };

  const removeProduct = (id) => {
    if (!isOrganizer) return showToast("Somente organizadores podem remover.", "error");
    setData({ ...data, products: data.products.filter((p) => p.id !== id) });
    showToast("Produto removido.");
  };

  const loginOrganizer = (e) => {
    e && e.preventDefault();
    if (!authName.trim() || authPwd !== ORGANIZER_PASSWORD) {
      showToast("Nome inválido ou senha incorreta.", "error");
      return;
    }
    const first = firstName(authName);
    if (!data.organizers.includes(first)) {
      showToast("Você não é um organizador autorizado.", "error");
      return;
    }
    setIsOrganizer(true);
    setCurrentOrganizer(first);
    setAuthName("");
    setAuthPwd("");
    setShowOrganizerPanel(false);
    showToast("Acesso de organizador concedido.");
  };

  const logoutOrganizer = () => {
    setIsOrganizer(false);
    setCurrentOrganizer("");
    showToast("Saída da área de organizador.");
  };

  const resetAll = () => {
    if (!isOrganizer) return showToast("Apenas organizadores.", "error");
    if (!window.confirm("Tem certeza que deseja zerar participantes e compras?")) return;
    setData({ ...data, participants: [], products: [] });
    showToast("Dados zerados.");
  };

  const addNewOrganizer = () => {
    if (!isOrganizer) return showToast("Apenas organizadores podem adicionar.", "error");
    if (currentOrganizer !== "murilo") return showToast("Somente Murilo pode adicionar organizadores.", "error");
    const name = (newOrgName || "").trim();
    if (!name) return showToast("Nome inválido.", "error");
    if (masterPwd !== MASTER_PASSWORD) return showToast("Senha mestra incorreta.", "error");
    const first = firstName(name);
    if (data.organizers.includes(first)) return showToast("Organizador já existe.", "error");
    setData({ ...data, organizers: [...data.organizers, first] });
    setNewOrgName("");
    setMasterPwd("");
    showToast("Novo organizador adicionado.");
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "piscinaapp-data.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJSON = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        if (!parsed || typeof parsed !== "object") throw new Error("Inválido");
        setData(parsed);
        showToast("Arquivo importado com sucesso.");
      } catch (err) {
        showToast("Arquivo JSON inválido.", "error");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div style={styles.app}>
      <div style={styles.container}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.title}>PiscinaApp</h1>
            <div style={styles.subtitle}>Meta da piscina: R$ {POOL_TARGET.toFixed(2)}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            {!isOrganizer ? (
              <button style={styles.btn} onClick={() => setShowOrganizerPanel(true)}>Entrar como organizador</button>
            ) : (
              <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "flex-end" }}>
                <div style={styles.badge}>Organizador: {currentOrganizer}</div>
                <button style={{ ...styles.btn, ...styles.btnOutline }} onClick={logoutOrganizer}>Sair</button>
              </div>
            )}
          </div>
        </header>

        {toast && (
          <div style={{ ...(toast.type === "error" ? styles.toastError : styles.toastSuccess) }}>{toast.text}</div>
        )}

        {poolReached() && (
          <div style={styles.alert}>🎉 Meta de R$ {POOL_TARGET.toFixed(2)} atingida!</div>
        )}

        <main style={styles.main}>
          <section style={styles.left}>
            <div style={styles.card}>
              <h2>Adicionar participante</h2>
              <form style={styles.row} onSubmit={addParticipant}>
                <input style={styles.input} placeholder="Nome" value={nameInput} onChange={e => setNameInput(e.target.value)} />
                <input style={styles.input} placeholder="Pago (R$)" value={paidInput} onChange={e => setPaidInput(e.target.value)} />
                <button style={styles.btn} type="submit">Adicionar</button>
              </form>
              <div style={styles.muted}>Cada pessoa paga R$ {TARGET_PER_PERSON.toFixed(2)}.</div>
            </div>

            <div style={{ ...styles.card, marginTop: 12 }}>
              <h2>Participantes</h2>
              {data.participants.length === 0 ? (
                <div style={styles.muted}>Nenhum participante ainda.</div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Nome</th>
                        <th style={styles.th}>Pago (R$)</th>
                        <th style={styles.th}>Falta (R$)</th>
                        {isOrganizer && <th style={styles.th}>Ações</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {data.participants.map(p => {
                        const rem = Math.max(0, TARGET_PER_PERSON - Number(p.paid || 0));
                        return (
                          <tr key={p.id}>
                            <td style={styles.td}>{p.name}</td>
                            <td style={styles.td}>R$ {Number(p.paid).toFixed(2)}</td>
                            <td style={styles.td}>
                              {rem === 0 ? (
                                <span style={styles.pillGreen}>Pago</span>
                              ) : (
                                <span style={styles.pillOrange}>R$ {rem.toFixed(2)} faltando</span>
                              )}
                            </td>
                            {isOrganizer && (
                              <td style={styles.td}>
                                <button style={{ ...styles.btn, ...styles.btnSmall, marginRight: 8 }} onClick={() => {
                                  const newVal = prompt("Novo valor pago (R$)", String(p.paid));
                                  if (newVal !== null) updateParticipantPaid(p.id, newVal);
                                }}>Editar</button>
                                <button style={{ ...styles.btn, ...styles.btnSmall }} onClick={() => removeParticipant(p.id)}>Remover</button>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div style={{ ...styles.card, marginTop: 12 }}>
              <h2>Resumo financeiro</h2>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <div style={styles.muted}>Total arrecadado</div>
                  <div style={{ fontSize: 20, fontWeight: 700 }}>R$ {totalCollected().toFixed(2)}</div>
                </div>
                <div>
                  <div style={styles.muted}>Falta para R$ {POOL_TARGET}</div>
                  <div style={{ fontSize: 20, fontWeight: 700 }}>R$ {remainingPool().toFixed(2)}</div>
                </div>
              </div>
            </div>

            <div style={{ ...styles.card, marginTop: 12 }}>
              <h2>Exportar / Importar</h2>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button style={styles.btn} onClick={exportJSON}>Baixar JSON</button>
                <label style={styles.fileLabel}>
                  <input type="file" accept="application/json" style={{ display: "none" }} onChange={(e) => e.target.files[0] && importJSON(e.target.files[0])} />
                  <span style={styles.link}>Importar JSON</span>
                </label>
              </div>
              <div style={{ marginTop: 8 }} className="muted">Os dados também são salvos automaticamente no seu navegador.</div>
            </div>
          </section>

          <aside style={styles.right}>
            <div style={styles.card}>
              <h2>Lista de compras</h2>
              <div style={styles.muted}>Visível para todos. Somente organizadores podem adicionar/editar/remover.</div>

              <form style={{ display: "flex", gap: 8, marginTop: 10 }} onSubmit={addProduct}>
                <input style={styles.input} placeholder="Produto" value={prodName} onChange={e => setProdName(e.target.value)} />
                <input style={styles.input} placeholder="Preço (R$)" value={prodPrice} onChange={e => setProdPrice(e.target.value)} />
                <button style={styles.btn} type="submit">Adicionar</button>
              </form>

              <div style={{ marginTop: 12 }}>
                {data.products.length === 0 ? (
                  <div style={styles.muted}>Nenhum produto ainda.</div>
                ) : (
                  <ul style={{ listStyle: "none", padding: 0 }}>
                    {data.products.map(prod => (
                      <li key={prod.id} style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "6px 0", alignItems: "center" }}>
                        <div>{prod.name}</div>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <div style={{ minWidth: 90 }}>R$ {Number(prod.price).toFixed(2)}</div>
                          {isOrganizer && (
                            <>
                              <button style={{ ...styles.btn, ...styles.btnSmall }} onClick={() => editProduct(prod.id)}>Editar</button>
                              <button style={{ ...styles.btn, ...styles.btnSmall }} onClick={() => removeProduct(prod.id)}>Remover</button>
                            </>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                <div style={{ borderTop: "1px solid #eee", marginTop: 10, paddingTop: 10, display: "flex", justifyContent: "space-between" }}>
                  <div style={styles.muted}>Total das compras</div>
                  <div style={{ fontWeight: 700 }}>R$ {productsTotal().toFixed(2)}</div>
                </div>
              </div>
            </div>

            {isOrganizer && (
              <div style={{ ...styles.card, marginTop: 12 }}>
                <h3>Área do organizador</h3>
                <div style={styles.muted}>Ferramentas administrativas</div>
                <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                  <button style={styles.btn} onClick={resetAll}>Zerar participantes e compras</button>

                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input style={styles.input} placeholder="Novo organizador (nome)" value={newOrgName} onChange={e => setNewOrgName(e.target.value)} />
                    <input style={styles.input} placeholder="Senha mestra" value={masterPwd} onChange={e => setMasterPwd(e.target.value)} />
                    <button style={styles.btn} onClick={addNewOrganizer}>Adicionar organizador</button>
                  </div>

                  <div style={{ fontSize: 13, color: "#666" }}>
                    Organizadores atuais: {data.organizers.join(", ")}
                  </div>
                </div>
              </div>
            )}

            {!isOrganizer && showOrganizerPanel && (
              <div style={{ ...styles.card, marginTop: 12 }}>
                <h3>Entrar como organizador</h3>
                <form style={{ display: "flex", flexDirection: "column", gap: 8 }} onSubmit={loginOrganizer}>
                  <input style={styles.input} placeholder="Seu nome" value={authName} onChange={e => setAuthName(e.target.value)} />
                  <input style={styles.input} placeholder="Senha" value={authPwd} onChange={e => setAuthPwd(e.target.value)} />
                  <div style={{ display: "flex", gap: 8 }}>
                    <button style={styles.btn} type="submit">Entrar</button>
                    <button style={{ ...styles.btn, ...styles.btnOutline }} type="button" onClick={() => setShowOrganizerPanel(false)}>Cancelar</button>
                  </div>
                </form>
                <div style={{ marginTop: 8, fontSize: 13, color: "#666" }}>
                  Senha de organizador: <strong>OsMelhores</strong>
                </div>
              </div>
            )}

          </aside>
        </main>

        <footer style={styles.footer}>
          Feito com ❤️ — PiscinaApp
        </footer>
      </div>
    </div>
  );
}

const styles = {
  app: {
    background: "#eaf6ff",
    minHeight: "100vh",
    padding: 20,
    fontFamily: "Inter, Roboto, Arial, sans-serif",
  },
  container: {
    maxWidth: 1100,
    margin: "12px auto",
    background: "linear-gradient(180deg,#ffffff,#f6fbff)",
    padding: 20,
    borderRadius: 12,
    boxShadow: "0 10px 30px rgba(30,45,80,0.06)",
  },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  title: { margin: 0, fontSize: 26 },
  subtitle: { fontSize: 13, color: "#556", marginTop: 4 },
  btn: {
    background: "#2ea6ff",
    border: "none",
    color: "white",
    padding: "8px 12px",
    borderRadius: 12,
    cursor: "pointer",
    fontWeight: 700,
  },
  btnOutline: {
    background: "transparent",
    color: "#1f6fb2",
    border: "1px solid #d6e6ff",
  },
  btnSmall: { padding: "6px 8px", fontSize: 13 },
  card: { background: "white", padding: 14, borderRadius: 12, boxShadow: "0 6px 18px rgba(30,45,80,0.04)" },
  row: { display: "flex", gap: 8, alignItems: "center" },
  input: { padding: "8px 10px", borderRadius: 10, border: "1px solid #e6eef9", flex: 1 },
  muted: { fontSize: 13, color: "#4b5563", marginTop: 8 },
  main: { display: "grid", gridTemplateColumns: "1fr 380px", gap: 18, marginTop: 12 },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", padding: "8px 6px", fontSize: 13, color: "#333", borderBottom: "1px solid #eee" },
  td: { padding: "8px 6px", borderBottom: "1px solid #fafafa" },
  pillGreen: { background: "#e6ffef", color: "#0b8a3e", padding: "6px 8px", borderRadius: 20, fontWeight: 700, fontSize: 13 },
  pillOrange: { background: "#fff7e6", color: "#b15300", padding: "6px 8px", borderRadius: 20, fontWeight: 700, fontSize: 13 },
  toastSuccess: { background: "#e6fbf2", color: "#0b8a3e", padding: 10, borderRadius: 8, marginBottom: 12 },
  toastError: { background: "#fff0f0", color: "#b00020", padding: 10, borderRadius: 8, marginBottom: 12 },
  alert: { background: "#f0fdf4", border: "1px solid #d1fae5", color: "#065f46", padding: 12, borderRadius: 8, marginBottom: 12, fontWeight: 700 },
  footer: { marginTop: 18, textAlign: "center", color: "#556", fontSize: 13 },
  badge: { background: "#eef7ff", padding: "6px 10px", borderRadius: 8, color: "#234a78", fontWeight: 700 },
  fileLabel: { cursor: "pointer", display: "inline-block" },
};
