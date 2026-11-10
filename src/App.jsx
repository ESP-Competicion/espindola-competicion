import React, { useState } from 'react';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [userRole, setUserRole] = useState('driver'); // 'guest' | 'driver' | 'admin'
  const [selectedChamp, setSelectedChamp] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");

  const championships = [
    {
      id: 1,
      title: "Monomarca Saveiro",
      surface: "Asfalto",
      status: "Inscripciones Abiertas",
      category: "Volkswagen Saveiro",
      dates: "Inicia 12 de Noviembre",
      registered: 14,
      desc: "Primera Fecha del Campeonato de la Monomarca Saveiro."
    },
    {
      id: 2,
      title: "Desafio de los Valientes",
      surface: "Tierra",
      status: "Próximamente",
      category: "Próximamente",
      dates: "Próximamente",
      registered: 0,
      desc: "Un Campeonato donde no solo importa ser rapido, sino también ser valiente. ¡Prepárate para los desafíos más extremos!"
    }
  ];

  const drivers = [
    { name: "Lucas Negri", role: "Piloto Líder / Fundador", car: "Renault Clio Rally5", wins: 4, points: 142 },
    { name: "Pedro Laninha", role: "Co-Driver / Piloto Oficial", car: "Peugeot 208 Rally4", wins: 2, points: 115 }
  ];

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#05070a',
      // Fondo más visible (menos opacidad oscura para que la foto destaque más)
      backgroundImage: `linear-gradient(180deg, rgba(5,7,10,0.55) 0%, rgba(9,13,22,0.68) 50%, rgba(5,7,10,0.80) 100%), url('https://files.catbox.moe/lkx4zp.png')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      color: '#f3f4f6',
      fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
    }}>
      
      {/* BARRA SUPERIOR DE ROL Y BANDERA ARGENTINA */}
      <div style={{
        backgroundColor: 'rgba(3, 5, 8, 0.95)',
        borderBottom: '1px solid rgba(116, 172, 223, 0.3)',
        padding: '6px 24px',
        fontSize: '12px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backdropFilter: 'blur(8px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '4px', backgroundColor: 'rgba(116, 172, 223, 0.15)', border: '1px solid rgba(116, 172, 223, 0.3)' }}>
            <span style={{ fontSize: '10px', color: '#74ACDF', fontWeight: '900', letterSpacing: '1px' }}>ARGENTINA</span>
            <span style={{ color: '#F6B40E', fontSize: '12px' }}>☀️</span>
          </div>
          <span style={{ color: '#9ca3af', fontWeight: '600' }}>MODO DE VISTA:</span>
          <button onClick={() => setUserRole('guest')} style={{ background: userRole === 'guest' ? 'linear-gradient(135deg, #74ACDF, #3b82f6)' : 'rgba(255,255,255,0.08)', color: userRole === 'guest' ? '#fff' : '#9ca3af', border: 'none', padding: '3px 10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px' }}>Visitante</button>
          <button onClick={() => setUserRole('driver')} style={{ background: userRole === 'driver' ? 'linear-gradient(135deg, #F6B40E, #d97706)' : 'rgba(255,255,255,0.08)', color: userRole === 'driver' ? '#000' : '#9ca3af', border: 'none', padding: '3px 10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px' }}>Piloto (Lucas)</button>
          <button onClick={() => setUserRole('admin')} style={{ background: userRole === 'admin' ? 'linear-gradient(135deg, #74ACDF, #F6B40E)' : 'rgba(255,255,255,0.08)', color: userRole === 'admin' ? '#000' : '#9ca3af', border: 'none', padding: '3px 10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px' }}>Admin</button>
        </div>
        <div style={{ color: '#9ca3af', fontFamily: 'monospace', fontSize: '11px' }}>
          EQUIPO OFICIAL: <strong style={{ color: '#74ACDF', textTransform: 'uppercase' }}>{userRole}</strong>
        </div>
      </div>

      {/* HEADER PRINCIPAL */}
      <header style={{
        backgroundColor: 'rgba(13, 17, 23, 0.90)',
        borderBottom: '2px solid rgba(246, 180, 14, 0.5)',
        padding: '12px 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backdropFilter: 'blur(12px)',
        boxShadow: '0 10px 30px rgba(0,0,0,0.8)'
      }}>
        
        {/* AQUÍ ESTÁ TU LOGO OFICIAL CORRECTO EN EL HEADER */}
        <div onClick={() => setActiveTab('home')} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', height: '46px' }}>
          <img 
            src="https://ibb.co/pj1vDDkX" 
            alt="Espíndola Competición" 
            style={{ height: '44px', width: 'auto', objectFit: 'contain', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.8))' }} 
            onError={(e) => {
              // Fallback por si la plataforma de imágenes requiere enlace directo de archivo
              e.target.onerror = null;
              e.target.src = "https://files.catbox.moe/lkx4zp.png"; 
            }}
          />
        </div>

        {/* NAV PÍLLULA WRC BROADCAST */}
        <nav style={{
          display: 'flex',
          background: 'rgba(22, 27, 34, 0.85)',
          border: '1px solid rgba(116, 172, 223, 0.3)',
          borderRadius: '30px',
          padding: '4px',
          boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.6)'
        }}>
          <button onClick={() => setActiveTab('home')} style={{
            backgroundColor: activeTab === 'home' ? '#74ACDF' : 'transparent',
            color: activeTab === 'home' ? '#000' : '#d1d5db',
            border: 'none',
            padding: '8px 22px',
            borderRadius: '20px',
            fontWeight: '900',
            fontSize: '12px',
            cursor: 'pointer',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            boxShadow: activeTab === 'home' ? '0 0 15px rgba(116, 172, 223, 0.6)' : 'none',
            transition: 'all 0.3s'
          }}>
            Tiempos en Vivo
          </button>
          <button onClick={() => setActiveTab('championships')} style={{
            backgroundColor: activeTab === 'championships' ? '#F6B40E' : 'transparent',
            color: activeTab === 'championships' ? '#000' : '#d1d5db',
            border: 'none',
            padding: '8px 22px',
            borderRadius: '20px',
            fontWeight: '900',
            fontSize: '12px',
            cursor: 'pointer',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            boxShadow: activeTab === 'championships' ? '0 0 15px rgba(246, 180, 14, 0.6)' : 'none',
            transition: 'all 0.3s'
          }}>
            Campeonatos
          </button>
          <button onClick={() => setActiveTab('drivers')} style={{
            backgroundColor: activeTab === 'drivers' ? '#74ACDF' : 'transparent',
            color: activeTab === 'drivers' ? '#000' : '#d1d5db',
            border: 'none',
            padding: '8px 22px',
            borderRadius: '20px',
            fontWeight: '900',
            fontSize: '12px',
            cursor: 'pointer',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            boxShadow: activeTab === 'drivers' ? '0 0 15px rgba(116, 172, 223, 0.6)' : 'none',
            transition: 'all 0.3s'
          }}>
            Pilotos & Historial
          </button>
        </nav>

        {/* PERFIL */}
        <div style={{
          backgroundColor: 'rgba(22, 27, 34, 0.9)',
          border: '1px solid rgba(246, 180, 14, 0.4)',
          padding: '8px 18px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
        }}>
          <span style={{ color: '#F6B40E' }}>🏎️</span>
          <span style={{ color: '#fff' }}>{userRole === 'guest' ? 'Visitante' : userRole === 'driver' ? 'Lucas Negri' : 'Marcos (Admin)'}</span>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main style={{ maxWidth: '1240px', margin: '36px auto', padding: '0 24px' }}>
        
        {activeTab === 'home' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(13, 17, 23, 0.90) 0%, rgba(22, 27, 34, 0.80) 100%)',
              borderLeft: '6px solid #74ACDF',
              borderTop: '1px solid rgba(116, 172, 223, 0.3)',
              borderRight: '1px solid rgba(116, 172, 223, 0.2)',
              borderBottom: '1px solid rgba(246, 180, 14, 0.3)',
              borderRadius: '20px',
              padding: '28px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
              backdropFilter: 'blur(10px)'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ backgroundColor: '#ff3b30', color: '#fff', fontSize: '10px', fontWeight: '900', padding: '4px 10px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '1px', boxShadow: '0 0 10px rgba(255,59,48,0.5)' }}>
                    🔴 TIEMPO EN VIVO
                  </span>
                  <span style={{ color: '#74ACDF', fontSize: '11px', fontFamily: 'monospace', fontWeight: 'bold' }}>ASSETTO RACING SERVER</span>
                </div>
                <h2 style={{ fontSize: '32px', fontStyle: 'italic', fontWeight: '900', margin: '12px 0 0 0', color: '#ffffff' }}>
                  
                </h2>
              </div>
              <div style={{
                backgroundColor: 'rgba(5, 7, 10, 0.8)',
                border: '1px solid rgba(246, 180, 14, 0.5)',
                padding: '12px 24px',
                borderRadius: '14px',
                color: '#F6B40E',
                fontSize: '13px',
                fontFamily: 'monospace',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <span style={{ width: '12px', height: '12px', backgroundColor: '#34d399', borderRadius: '50%', display: 'inline-block', boxShadow: '0 0 10px #34d399' }}></span>
                Servidor Oficial Conectado
              </div>
            </div>

            <div style={{
              backgroundColor: 'rgba(13, 17, 23, 0.90)',
              border: '1px solid rgba(116, 172, 223, 0.3)',
              borderRadius: '20px',
              overflow: 'hidden',
              boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{
                backgroundColor: 'rgba(5, 7, 10, 0.95)',
                padding: '18px 28px',
                borderBottom: '1px solid rgba(116, 172, 223, 0.2)',
                fontWeight: '900',
                fontSize: '14px',
                textTransform: 'uppercase',
                letterSpacing: '2px',
                color: '#74ACDF',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span>🏁 CLASIFICACIÓN EN TIEMPO REAL</span>
                <span style={{ fontSize: '11px', color: '#F6B40E', fontFamily: 'monospace' }}>TRAMO: STAGE 02 - GRAVA</span>
              </div>
              
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontFamily: 'monospace' }}>
                <thead>
                  <tr style={{ backgroundColor: 'rgba(0,0,0,0.6)', color: '#9ca3af', fontSize: '11px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <th style={{ padding: '16px 24px' }}>POS</th>
                    <th style={{ padding: '16px 24px' }}>PILOTO OFICIAL</th>
                    <th style={{ padding: '16px 24px' }}>VEHÍCULO</th>
                    <th style={{ padding: '16px 24px' }}>TIEMPO SECTOR</th>
                    <th style={{ padding: '16px 24px' }}>ESTADO</th>
                  </tr>
                </thead>
                <tbody style={{ fontSize: '14px' }}>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', backgroundColor: 'rgba(116, 172, 223, 0.08)' }}>
                    <td style={{ padding: '18px 24px', fontWeight: '900', color: '#F6B40E', fontSize: '16px' }}>1</td>
                    <td style={{ padding: '18px 24px', fontWeight: 'bold', color: '#ffffff' }}>
                      Lucas Negri <span style={{ fontSize: '10px', backgroundColor: '#74ACDF', color: '#000', padding: '2px 6px', borderRadius: '4px', marginLeft: '6px' }}>ARG</span>
                    </td>
                    <td style={{ padding: '18px 24px', color: '#d1d5db' }}>Renault Clio Rally5</td>
                    <td style={{ padding: '18px 24px', color: '#F6B40E', fontWeight: '900', fontSize: '16px' }}>03:42.105</td>
                    <td style={{ padding: '18px 24px' }}>
                      <span style={{ backgroundColor: 'rgba(52, 211, 153, 0.2)', border: '1px solid #34d399', color: '#34d399', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold' }}>EN PISTA</span>
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '18px 24px', fontWeight: '900', color: '#9ca3af', fontSize: '16px' }}>2</td>
                    <td style={{ padding: '18px 24px', fontWeight: 'bold', color: '#ffffff' }}>
                      Pedro Laninha <span style={{ fontSize: '10px', backgroundColor: '#74ACDF', color: '#000', padding: '2px 6px', borderRadius: '4px', marginLeft: '6px' }}>ARG</span>
                    </td>
                    <td style={{ padding: '18px 24px', color: '#d1d5db' }}>Peugeot 208 Rally4</td>
                    <td style={{ padding: '18px 24px', color: '#74ACDF', fontWeight: '900', fontSize: '16px' }}>03:44.890</td>
                    <td style={{ padding: '18px 24px' }}>
                      <span style={{ backgroundColor: 'rgba(52, 211, 153, 0.2)', border: '1px solid #34d399', color: '#34d399', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold' }}>EN PISTA</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'championships' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            <div>
              <h2 style={{ fontSize: '32px', fontStyle: 'italic', fontWeight: '900', margin: 0, color: '#fff' }}>CAMPEONATOS ACTIVOS</h2>
              <p style={{ color: '#74ACDF', fontSize: '14px', fontFamily: 'monospace', margin: '4px 0 0 0' }}>Torneos oficiales organizados por Espíndola Competición</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
              {championships.map((champ) => (
                <div key={champ.id} style={{
                  backgroundColor: 'rgba(13, 17, 23, 0.90)',
                  border: '1px solid rgba(246, 180, 14, 0.4)',
                  borderRadius: '20px',
                  padding: '28px',
                  display: 'flex',
                  flexDirection: 'column',
                  justify: 'space-between',
                  boxShadow: '0 15px 35px rgba(0,0,0,0.7)',
                  backdropFilter: 'blur(10px)'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ backgroundColor: 'rgba(116, 172, 223, 0.2)', color: '#74ACDF', border: '1px solid #74ACDF', padding: '4px 14px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold', fontFamily: 'monospace' }}>{champ.surface}</span>
                      <span style={{ fontSize: '12px', color: '#F6B40E', fontFamily: 'monospace', fontWeight: 'bold' }}>📅 {champ.dates}</span>
                    </div>
                    <h3 style={{ fontSize: '24px', fontWeight: '900', fontStyle: 'italic', margin: 0, color: '#fff' }}>{champ.title}</h3>
                    <p style={{ fontSize: '14px', color: '#d1d5db', margin: 0, lineHeight: '1.5' }}>{champ.desc}</p>
                    <div style={{ fontSize: '12px', color: '#9ca3af', fontFamily: 'monospace', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '12px' }}>
                      Categoría: <strong style={{ color: '#fff' }}>{champ.category}</strong> | Inscriptos: <strong style={{ color: '#F6B40E' }}>{champ.registered} Pilotos</strong>
                    </div>
                  </div>
                  <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '18px' }}>
                    <span style={{ color: '#34d399', fontSize: '12px', fontWeight: 'bold' }}>✓ {champ.status}</span>
                    <button onClick={() => setSelectedChamp(champ)} style={{
                      background: 'linear-gradient(135deg, #F6B40E, #d97706)',
                      color: '#000',
                      border: 'none',
                      padding: '12px 24px',
                      borderRadius: '12px',
                      fontWeight: '900',
                      fontSize: '12px',
                      cursor: 'pointer',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      boxShadow: '0 4px 15px rgba(246, 180, 14, 0.4)'
                    }}>
                      Inscribirme ➔
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'drivers' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            <div>
              <h2 style={{ fontSize: '32px', fontStyle: 'italic', fontWeight: '900', margin: 0, color: '#fff' }}>PLANTEL OFICIAL DE PILOTOS</h2>
              <p style={{ color: '#74ACDF', fontSize: '14px', fontFamily: 'monospace', margin: '4px 0 0 0' }}>Competidores de Espíndola Competición Misiones, Argentina</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
              {drivers.map((d, i) => (
                <div key={i} style={{
                  backgroundColor: 'rgba(13, 17, 23, 0.90)',
                  border: '1px solid rgba(116, 172, 223, 0.4)',
                  borderRadius: '20px',
                  padding: '28px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '18px',
                  boxShadow: '0 15px 35px rgba(0,0,0,0.7)',
                  backdropFilter: 'blur(10px)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '18px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '18px' }}>
                    <div style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '50%',
                      backgroundColor: '#05070a',
                      border: '2px solid #74ACDF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '900',
                      fontSize: '20px',
                      color: '#F6B40E',
                      boxShadow: '0 0 15px rgba(116, 172, 223, 0.4)'
                    }}>
                      {d.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '22px', fontWeight: '900', fontStyle: 'italic', margin: 0, color: '#fff' }}>{d.name}</h3>
                      <p style={{ fontSize: '12px', color: '#74ACDF', margin: '2px 0 0 0', fontFamily: 'monospace', fontWeight: 'bold' }}>{d.role}</p>
                      <p style={{ fontSize: '12px', color: '#9ca3af', margin: '2px 0 0 0' }}>Vehículo: {d.car}</p>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', textAlign: 'center', backgroundColor: 'rgba(5, 7, 10, 0.8)', padding: '16px', borderRadius: '12px', fontFamily: 'monospace' }}>
                    <div>
                      <div style={{ fontSize: '22px', fontWeight: '900', color: '#fff' }}>{d.wins}</div>
                      <div style={{ fontSize: '10px', color: '#74ACDF', textTransform: 'uppercase', fontWeight: 'bold' }}>Victorias</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '22px', fontWeight: '900', color: '#F6B40E' }}>{d.points}</div>
                      <div style={{ fontSize: '10px', color: '#F6B40E', textTransform: 'uppercase', fontWeight: 'bold' }}>Puntos Totales</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* MODAL DE INSCRIPCIÓN WRC */}
      {selectedChamp && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <div style={{
            backgroundColor: '#0d1117',
            border: '2px solid #74ACDF',
            borderRadius: '20px',
            maxWidth: '460px',
            width: '100%',
            padding: '32px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            position: 'relative',
            boxShadow: '0 25px 60px rgba(0,0,0,0.9)'
          }}>
            <button onClick={() => setSelectedChamp(null)} style={{ position: 'absolute', top: '18px', right: '18px', background: 'transparent', border: 'none', color: '#9ca3af', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            
            <div>
              <span style={{ fontSize: '11px', color: '#F6B40E', fontFamily: 'monospace', textTransform: 'uppercase', fontWeight: 'bold' }}>Inscripción Oficial WRC</span>
              <h3 style={{ fontSize: '22px', fontStyle: 'italic', fontWeight: '900', margin: '4px 0 0 0', color: '#fff' }}>{selectedChamp.title}</h3>
            </div>

            {successMsg ? (
              <div style={{ backgroundColor: 'rgba(52, 211, 153, 0.2)', border: '1px solid #34d399', color: '#34d399', padding: '16px', borderRadius: '12px', textAlign: 'center', fontFamily: 'monospace', fontSize: '14px', fontWeight: 'bold' }}>
                {successMsg}
              </div>
            ) : (
              <form onSubmit={(e) => {
                e.preventDefault();
                setSuccessMsg(`¡Inscripción exitosa a "${selectedChamp.title}"!`);
                setTimeout(() => { setSuccessMsg(""); setSelectedChamp(null); }, 2500);
              }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontFamily: 'monospace', color: '#74ACDF', marginBottom: '6px', fontWeight: 'bold' }}>Nombre del Piloto / Dupla</label>
                  <input type="text" defaultValue={userRole === 'driver' ? "Lucas Negri" : ""} required style={{ width: '100%', backgroundColor: '#05070a', border: '1px solid rgba(116, 172, 223, 0.4)', borderRadius: '12px', padding: '12px 16px', color: '#fff', outline: 'none', fontFamily: 'monospace', fontSize: '14px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontFamily: 'monospace', color: '#74ACDF', marginBottom: '6px', fontWeight: 'bold' }}>Vehículo de Competición</label>
                  <select style={{ width: '100%', backgroundColor: '#05070a', border: '1px solid rgba(116, 172, 223, 0.4)', borderRadius: '12px', padding: '12px 16px', color: '#fff', outline: 'none', fontFamily: 'monospace', fontSize: '14px' }}>
                    <option>Renault Clio Rally5</option>
                    <option>Peugeot 208 Rally4</option>
                    <option>Volkswagen Gol Power G4</option>
                  </select>
                </div>
                <button type="submit" style={{
                  background: 'linear-gradient(135deg, #74ACDF, #3b82f6)',
                  color: '#fff',
                  border: 'none',
                  padding: '16px',
                  borderRadius: '12px',
                  fontWeight: '900',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  letterSpacing: '1px',
                  marginTop: '10px',
                  boxShadow: '0 4px 15px rgba(116, 172, 223, 0.4)'
                }}>
                  Confirmar Registro
                </button>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}