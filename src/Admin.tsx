import { useEffect, useMemo, useState } from 'react';
import {
  Copy,
  ExternalLink,
  LogOut,
  MessageCircle,
  Plus,
  RefreshCw,
  Trash2,
  Users,
} from 'lucide-react';
import { event } from './config';

type I = {
  code: string;
  family_name: string;
  max_guests: number;
  attending?: boolean | null;
  guest_count?: number | null;
  contact_name?: string | null;
  message?: string | null;
};

const SITE = 'https://xvkimberly.github.io/XV-kimberly/';

export default function Admin() {
  const [secret, setSecret] = useState(
    sessionStorage.getItem('xv_admin') || ''
  );

  const [input, setInput] = useState('');
  const [items, setItems] = useState<I[]>([]);
  const [name, setName] = useState('');
  const [guests, setGuests] = useState(2);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const api = async (method = 'GET', body?: any) => {
    const r = await fetch(event.supabase.adminUrl, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-admin-secret': secret,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const d = await r.json().catch(() => ({}));

    if (r.status === 401 || r.status === 403) {
      sessionStorage.removeItem('xv_admin');
      setSecret('');
      throw Error('Contraseña incorrecta');
    }

    if (!r.ok) {
      throw Error(d.error || 'Error del servidor');
    }

    return d;
  };

  const load = async () => {
    if (!secret) return;

    setBusy(true);

    try {
      const d = await api();
      setItems(d.invitations || d.items || []);
      setMsg('');
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    load();
  }, [secret]);

  const create = async (e: any) => {
    e.preventDefault();

    try {
      setMsg('');

      await api('POST', {
        family_name: name.trim(),
        max_guests: guests,
      });

      setName('');
      setGuests(2);

      await load();
    } catch (e: any) {
      setMsg(e.message);
    }
  };

  const url = (code: string) =>
    SITE + '?invite=' + encodeURIComponent(code);

  const confirmed = useMemo(
    () => items.filter((x) => x.attending === true),
    [items]
  );

  const declined = useMemo(
    () => items.filter((x) => x.attending === false),
    [items]
  );

  const people = useMemo(
    () =>
      confirmed.reduce(
        (total, x) => total + (x.guest_count || 0),
        0
      ),
    [confirmed]
  );

  /* =========================
     LOGIN ADMINISTRADOR
  ========================= */

  if (!secret) {
    return (
      <main className="adminLogin">
        <section className="adminLoginCard">

          <div className="adminK">K</div>

          <p className="eyebrow gold">
            ADMINISTRACIÓN
          </p>

          <h1>XV Kimberly</h1>

          <p>
            Acceso privado para administrar invitaciones
            y confirmaciones.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();

              const cleanSecret = input.trim();

              if (!cleanSecret) return;

              sessionStorage.setItem(
                'xv_admin',
                cleanSecret
              );

              setSecret(cleanSecret);
            }}
          >
            <label>
              Contraseña

              <input
                type="password"
                value={input}
                onChange={(e) =>
                  setInput(e.target.value)
                }
                autoComplete="current-password"
                required
              />
            </label>

            <button type="submit">
              ENTRAR
            </button>
          </form>

        </section>
      </main>
    );
  }

  /* =========================
     PANEL ADMINISTRADOR
  ========================= */

  return (
    <main className="adminPage">

      <header className="adminHeader">

        <div>
          <small>XV KIMBERLY</small>
          <h1>Administrador</h1>
        </div>

        <button
          className="iconBtn"
          onClick={() => {
            sessionStorage.removeItem('xv_admin');
            setSecret('');
            setInput('');
          }}
        >
          <LogOut size={18} />
          Salir
        </button>

      </header>

      {/* ESTADÍSTICAS */}

      <section className="adminStats">

        <article>
          <span>Invitaciones</span>
          <b>{items.length}</b>
        </article>

        <article>
          <span>Confirmadas</span>
          <b>{confirmed.length}</b>
        </article>

        <article>
          <span>No asistirán</span>
          <b>{declined.length}</b>
        </article>

        <article>
          <span>Personas confirmadas</span>
          <b>{people}</b>
        </article>

      </section>

      {/* CREAR INVITACIÓN */}

      <section className="adminPanel">

        <p className="eyebrow gold">
          NUEVA INVITACIÓN
        </p>

        <h2>
          Crear liga personalizada
        </h2>

        <form
          className="createInvite"
          onSubmit={create}
        >

          <label>
            Familia o invitado

            <input
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
              placeholder="Ej. Familia Martínez"
              required
            />
          </label>

          <label>
            Lugares

            <input
              type="number"
              min="1"
              max="20"
              value={guests}
              onChange={(e) =>
                setGuests(Number(e.target.value))
              }
              required
            />
          </label>

          <button type="submit">
            <Plus size={18} />
            CREAR INVITACIÓN
          </button>

        </form>

        {msg && (
          <p className="status">
            {msg}
          </p>
        )}

      </section>

      {/* LISTA RSVP */}

      <section className="adminPanel">

        <div className="panelTitle">

          <div>
            <p className="eyebrow gold">
              RSVP
            </p>

            <h2>
              Invitados
            </h2>
          </div>

          <button
            className="iconBtn"
            onClick={load}
            disabled={busy}
          >
            <RefreshCw size={17} />
            {busy ? 'Actualizando...' : 'Actualizar'}
          </button>

        </div>

        <div className="inviteList">

          {items.map((i) => (

            <article
              className="inviteRow"
              key={i.code}
            >

              <div className="inviteMain">

                <strong>
                  {i.family_name}
                </strong>

                <span>
                  {i.max_guests} lugares ·{' '}

                  <b
                    className={
                      i.attending === true
                        ? 'ok'
                        : i.attending === false
                        ? 'no'
                        : 'pending'
                    }
                  >
                    {i.attending === true
                      ? `Confirmó ${i.guest_count || 0}`
                      : i.attending === false
                      ? 'No asistirá'
                      : 'Pendiente'}
                  </b>
                </span>

                {i.contact_name && (
                  <small>
                    Respondió: {i.contact_name}
                  </small>
                )}

                {i.message && (
                  <small>
                    “{i.message}”
                  </small>
                )}

              </div>

              <div className="inviteActions">

                {/* COPIAR LIGA */}

                <button
                  type="button"
                  title="Copiar liga"
                  onClick={() =>
                    navigator.clipboard.writeText(
                      url(i.code)
                    )
                  }
                >
                  <Copy size={18} />
                </button>

                {/* ABRIR INVITACIÓN */}

                <button
                  type="button"
                  title="Abrir invitación"
                  onClick={() =>
                    window.open(
                      url(i.code),
                      '_blank'
                    )
                  }
                >
                  <ExternalLink size={18} />
                </button>

                {/* WHATSAPP */}

                <button
                  type="button"
                  title="Compartir por WhatsApp"
                  onClick={() =>
                    window.open(
                      'https://wa.me/?text=' +
                        encodeURIComponent(
                          `✨ Mis XV · Kimberly ✨
17 de octubre de 2026

${i.family_name}, acompáñame a celebrar este día tan especial. 💜

${url(i.code)}`
                        ),
                      '_blank'
                    )
                  }
                >
                  <MessageCircle size={18} />
                </button>

                {/* DESACTIVAR */}

                <button
                  type="button"
                  title="Desactivar invitación"
                  onClick={async () => {

                    if (
                      !confirm(
                        '¿Desactivar esta invitación?'
                      )
                    ) {
                      return;
                    }

                    try {
                      await api('DELETE', {
                        code: i.code,
                      });

                      await load();
                    } catch (e: any) {
                      setMsg(e.message);
                    }
                  }}
                >
                  <Trash2 size={18} />
                </button>

              </div>

            </article>

          ))}

        </div>

        {!busy && !items.length && (

          <div className="empty">
            <Users />
            <p>
              Aún no hay invitaciones.
            </p>
          </div>

        )}

      </section>

    </main>
  );
}
