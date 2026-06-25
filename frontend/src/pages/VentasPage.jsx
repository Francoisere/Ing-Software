import { useEffect, useState, useCallback } from 'react';
import {
  ShoppingCart, Plus, Minus, Trash2, Search,
  CreditCard, Banknote, CheckCircle, History, X,
} from 'lucide-react';
import { ventasAPI, inventarioAPI } from '../services/api';
import { Badge, Button, Card, Spinner, Modal, FormField, EmptyState } from '../components/ui/index.jsx';

const METODOS_PAGO = [
  { value: 'efectivo',   label: 'Efectivo',   icon: Banknote },
  { value: 'transbank',  label: 'Transbank',  icon: CreditCard },
];

// ── Historial de ventas ───────────────────────────────────────
function HistorialVentas() {
  const [ventas, setVentas]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [detalle, setDetalle] = useState(null);

  useEffect(() => {
    ventasAPI.listar().then(r => setVentas(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const verDetalle = async (id) => {
    try {
      const { data } = await ventasAPI.obtener(id);
      setDetalle(data);
    } catch (e) { console.error(e); }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}><Spinner /></div>;

  return (
    <>
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {ventas.length === 0
          ? <EmptyState icon={History} title="Sin ventas registradas" subtitle="Procesa tu primera venta en el POS" />
          : (
            <table>
              <thead>
                <tr>
                  <th>#</th><th>Fecha</th><th>Cajero</th><th>Cliente</th>
                  <th>Total</th><th>Pago</th><th></th>
                </tr>
              </thead>
              <tbody>
                {ventas.map(v => (
                  <tr key={v.id_venta}>
                    <td style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-muted)' }}>#{v.id_venta}</td>
                    <td style={{ fontSize: 12 }}>{new Date(v.fecha).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' })}</td>
                    <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{v.cajero}</td>
                    <td>{v.cliente}</td>
                    <td style={{ fontWeight: 700, color: 'var(--success)' }}>${Number(v.total).toLocaleString('es-CL')}</td>
                    <td style={{ textTransform: 'capitalize' }}>{v.metodo_pago}</td>
                    <td>
                      <button onClick={() => verDetalle(v.id_venta)} style={{
                        background: 'var(--accent-dim)', border: '1px solid var(--border)',
                        color: 'var(--accent)', padding: '4px 10px', borderRadius: 6,
                        fontSize: 11, fontWeight: 500, cursor: 'pointer',
                      }}>Ver</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        }
      </Card>

      {/* Modal detalle venta */}
      <Modal open={!!detalle} onClose={() => setDetalle(null)} title={`Venta #${detalle?.id_venta}`} width={500}>
        {detalle && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                ['Cajero', detalle.cajero],
                ['Cliente', detalle.cliente],
                ['Fecha', new Date(detalle.fecha).toLocaleString('es-CL')],
                ['Método', detalle.metodo_pago],
              ].map(([k, v]) => (
                <div key={k} style={{ background: 'var(--bg-base)', borderRadius: 8, padding: '8px 12px' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>{k}</div>
                  <div style={{ fontWeight: 500, textTransform: 'capitalize' }}>{v}</div>
                </div>
              ))}
            </div>
            <table>
              <thead><tr><th>Producto</th><th>Cant.</th><th>P. Unit.</th><th>Subtotal</th></tr></thead>
              <tbody>
                {(detalle.detalles || []).map(d => (
                  <tr key={d.id_detalle}>
                    <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{d.producto}</td>
                    <td>{d.cantidad}</td>
                    <td>${Number(d.precio_unitario).toLocaleString('es-CL')}</td>
                    <td style={{ fontWeight: 600 }}>${Number(d.subtotal).toLocaleString('es-CL')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '12px 14px', background: 'var(--accent-dim)',
              borderRadius: 8, border: '1px solid var(--border)',
            }}>
              <span style={{ fontWeight: 600 }}>TOTAL</span>
              <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent)' }}>
                ${Number(detalle.total).toLocaleString('es-CL')}
              </span>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

// ── Página principal POS ──────────────────────────────────────
export default function VentasPage() {
  const [tab, setTab]           = useState('pos'); // 'pos' | 'historial'
  const [productos, setProductos] = useState([]);
  const [search, setSearch]     = useState('');
  const [carrito, setCarrito]   = useState([]);
  const [metodoPago, setMetodo] = useState('efectivo');
  const [comprobante, setComp]  = useState('');
  const [loadingProd, setLoadingProd] = useState(true);
  const [procesando, setProcesando]   = useState(false);
  const [exitoVenta, setExitoVenta]   = useState(null);

  const cargarProductos = useCallback(async () => {
    setLoadingProd(true);
    try {
      const { data } = await inventarioAPI.listar({ activo: 1, search });
      setProductos(data);
    } catch (e) { console.error(e); }
    finally { setLoadingProd(false); }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(cargarProductos, 300);
    return () => clearTimeout(t);
  }, [cargarProductos]);

  // ── Carrito ───────────────────────────────────────────────
  const agregarAlCarrito = (producto) => {
    setCarrito(prev => {
      const existe = prev.find(i => i.id_producto === producto.id_producto);
      if (existe) {
        if (existe.cantidad >= producto.stock_actual) return prev; // no superar stock
        return prev.map(i => i.id_producto === producto.id_producto
          ? { ...i, cantidad: i.cantidad + 1 } : i);
      }
      if (producto.stock_actual < 1) return prev;
      return [...prev, { ...producto, cantidad: 1 }];
    });
  };

  const cambiarCantidad = (id, delta) => {
    setCarrito(prev => prev
      .map(i => i.id_producto === id ? { ...i, cantidad: i.cantidad + delta } : i)
      .filter(i => i.cantidad > 0)
    );
  };

  const quitarItem = (id) => setCarrito(prev => prev.filter(i => i.id_producto !== id));

  const total = carrito.reduce((acc, i) => acc + i.precio_venta * i.cantidad, 0);

  const procesarVenta = async () => {
    if (!carrito.length) return;
    setProcesando(true);
    try {
      const { data } = await ventasAPI.procesarVenta({
        metodo_pago: metodoPago,
        comprobante: comprobante || undefined,
        items: carrito.map(i => ({ id_producto: i.id_producto, cantidad: i.cantidad })),
      });
      setExitoVenta(data);
      setCarrito([]);
      setComp('');
      cargarProductos();
    } catch (e) {
      alert(e.response?.data?.error || 'Error al procesar la venta');
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div style={{ padding: '24px 28px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>Ventas</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>Punto de venta y historial</p>
        </div>
        <div style={{ display: 'flex', gap: 2, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: 3 }}>
          {[['pos', 'Punto de venta'], ['historial', 'Historial']].map(([v, l]) => (
            <button key={v} onClick={() => setTab(v)} style={{
              padding: '6px 16px', borderRadius: 6, border: 'none', cursor: 'pointer',
              fontWeight: 500, fontSize: 12, transition: 'var(--transition)',
              background: tab === v ? 'var(--accent)' : 'transparent',
              color: tab === v ? '#fff' : 'var(--text-muted)',
            }}>{l}</button>
          ))}
        </div>
      </div>

      {tab === 'historial' ? <HistorialVentas /> : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>

          {/* Panel productos */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Card style={{ padding: '12px 14px' }}>
              <div style={{ position: 'relative' }}>
                <Search size={15} style={{
                  position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--text-muted)', pointerEvents: 'none',
                }} />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar producto o código de barra..."
                  style={{ paddingLeft: 34 }} />
              </div>
            </Card>

            {loadingProd
              ? <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner /></div>
              : productos.length === 0
                ? <EmptyState icon={ShoppingCart} title="Sin productos" subtitle="No se encontraron productos activos" />
                : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
                    {productos.map(p => {
                      const enCarrito = carrito.find(i => i.id_producto === p.id_producto);
                      const sinStock  = p.stock_actual < 1;
                      return (
                        <div key={p.id_producto} onClick={() => !sinStock && agregarAlCarrito(p)}
                          style={{
                            background: 'var(--bg-card)', border: `1px solid ${enCarrito ? 'var(--accent)' : 'var(--border)'}`,
                            borderRadius: 'var(--radius-lg)', padding: '14px 12px',
                            cursor: sinStock ? 'not-allowed' : 'pointer',
                            opacity: sinStock ? 0.5 : 1,
                            transition: 'var(--transition)',
                          }}
                          onMouseEnter={e => { if (!sinStock) e.currentTarget.style.borderColor = 'var(--accent)'; }}
                          onMouseLeave={e => { if (!enCarrito) e.currentTarget.style.borderColor = 'var(--border)'; }}>
                          <div style={{
                            fontSize: 10, fontWeight: 600, letterSpacing: '0.05em',
                            textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6,
                          }}>{p.categoria}</div>
                          <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)', marginBottom: 6, lineHeight: 1.3 }}>
                            {p.nombre}
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 700, color: 'var(--accent)', fontSize: 15 }}>
                              ${Number(p.precio_venta).toLocaleString('es-CL')}
                            </span>
                            <span style={{
                              fontSize: 10, padding: '2px 7px', borderRadius: 20,
                              background: p.stock_actual <= p.stock_minimo ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.12)',
                              color: p.stock_actual <= p.stock_minimo ? 'var(--danger)' : 'var(--success)',
                              fontWeight: 500,
                            }}>
                              Stock: {p.stock_actual}
                            </span>
                          </div>
                          {enCarrito && (
                            <div style={{
                              marginTop: 8, fontSize: 11, color: 'var(--accent)',
                              fontWeight: 600, textAlign: 'center',
                            }}>
                              ✓ En carrito ({enCarrito.cantidad})
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )
            }
          </div>

          {/* Panel carrito */}
          <div style={{ position: 'sticky', top: 24 }}>
            <Card style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {/* Header carrito */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '14px 16px', borderBottom: '1px solid var(--border)',
              }}>
                <ShoppingCart size={16} color="var(--accent)" />
                <span style={{ fontWeight: 600, fontSize: 14 }}>Carrito</span>
                {carrito.length > 0 && (
                  <span style={{
                    marginLeft: 'auto', background: 'var(--accent)', color: '#fff',
                    borderRadius: 20, fontSize: 11, fontWeight: 700, padding: '1px 8px',
                  }}>{carrito.length}</span>
                )}
              </div>

              {/* Items */}
              <div style={{ minHeight: 120, padding: carrito.length ? 0 : '24px 16px' }}>
                {carrito.length === 0
                  ? <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center' }}>
                      Selecciona productos del catálogo
                    </div>
                  : carrito.map(item => (
                    <div key={item.id_producto} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 14px', borderBottom: '1px solid var(--border)',
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.nombre}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          ${Number(item.precio_venta).toLocaleString('es-CL')} c/u
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <button onClick={() => cambiarCantidad(item.id_producto, -1)} style={{
                          width: 22, height: 22, borderRadius: 6, border: '1px solid var(--border)',
                          background: 'var(--bg-base)', color: 'var(--text-secondary)',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}><Minus size={11} /></button>
                        <span style={{ fontSize: 13, fontWeight: 600, minWidth: 20, textAlign: 'center' }}>
                          {item.cantidad}
                        </span>
                        <button onClick={() => cambiarCantidad(item.id_producto, 1)} style={{
                          width: 22, height: 22, borderRadius: 6, border: '1px solid var(--border)',
                          background: 'var(--bg-base)', color: 'var(--text-secondary)',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}><Plus size={11} /></button>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, minWidth: 70, textAlign: 'right' }}>
                        ${Number(item.precio_venta * item.cantidad).toLocaleString('es-CL')}
                      </div>
                      <button onClick={() => quitarItem(item.id_producto)} style={{
                        background: 'none', border: 'none', color: 'var(--text-muted)',
                        cursor: 'pointer', padding: 2,
                      }}><Trash2 size={13} /></button>
                    </div>
                  ))
                }
              </div>

              {/* Total + pago */}
              {carrito.length > 0 && (
                <div style={{ padding: '14px 16px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600 }}>Total</span>
                    <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent)' }}>
                      ${total.toLocaleString('es-CL')}
                    </span>
                  </div>

                  {/* Método de pago */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    {METODOS_PAGO.map(({ value, label, icon: Icon }) => (
                      <button key={value} onClick={() => setMetodo(value)} style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
                        border: `1px solid ${metodoPago === value ? 'var(--accent)' : 'var(--border)'}`,
                        background: metodoPago === value ? 'var(--accent-dim)' : 'var(--bg-base)',
                        color: metodoPago === value ? 'var(--accent)' : 'var(--text-secondary)',
                        fontWeight: 500, fontSize: 12,
                      }}>
                        <Icon size={13} /> {label}
                      </button>
                    ))}
                  </div>

                  {metodoPago === 'transbank' && (
                    <input value={comprobante} onChange={e => setComp(e.target.value)}
                      placeholder="N° comprobante Transbank" />
                  )}

                  <Button onClick={procesarVenta} disabled={procesando || !carrito.length}
                    size="lg" style={{ width: '100%', justifyContent: 'center' }}>
                    {procesando ? 'Procesando...' : `Cobrar $${total.toLocaleString('es-CL')}`}
                  </Button>

                  <button onClick={() => setCarrito([])} style={{
                    background: 'none', border: 'none', color: 'var(--text-muted)',
                    fontSize: 12, cursor: 'pointer', textAlign: 'center',
                  }}>Vaciar carrito</button>
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* Modal venta exitosa */}
      <Modal open={!!exitoVenta} onClose={() => setExitoVenta(null)} title="¡Venta procesada!" width={400}>
        {exitoVenta && (
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <CheckCircle size={48} color="var(--success)" style={{ marginBottom: 12 }} />
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
              Venta #{exitoVenta.id_venta}
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--success)', marginBottom: 16 }}>
              ${Number(exitoVenta.total).toLocaleString('es-CL')}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
              {exitoVenta.metodo_pago} · {new Date(exitoVenta.fecha).toLocaleString('es-CL')}
            </div>
            <Button onClick={() => setExitoVenta(null)} style={{ width: '100%', justifyContent: 'center' }}>
              Nueva venta
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
