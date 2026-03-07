import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDefaultDashboardPath } from '../../../shared/constants/roles';
import { useAuth } from '../../../shared/context/AuthContext';
import fondoLogin from '../../../assets/images/Fondo_login.jpg';
import fondoLogin1 from '../../../assets/images/Fondo_login1.jpg';
import fondoLogin2 from '../../../assets/images/Fondo_login2.jpg';
import fondoLogin3 from '../../../assets/images/Fondo_login3.jpg';

const loginBackgrounds = [fondoLogin, fondoLogin1, fondoLogin2, fondoLogin3];

export function LoginPage() {
  const { loginWithPassword, verifyTwoFa } = useAuth();
  const navigate = useNavigate();
  const [correoElectronico, setCorreoElectronico] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [codigo, setCodigo] = useState('');
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [info, setInfo] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [backgroundIndex, setBackgroundIndex] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setBackgroundIndex((current) => (current + 1) % loginBackgrounds.length);
    }, 3000);

    return () => clearInterval(intervalId);
  }, []);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setInfo('');
    setIsLoading(true);

    try {
      const result = await loginWithPassword({
        correo_electronico: correoElectronico,
        contrasena,
      });

      if (result.status === 'requires_2fa') {
        setChallengeId(result.challengeId);
        setInfo(result.message || 'Código de verificación enviado a tu correo.');
      } else {
        navigate(getDefaultDashboardPath(result.user.roles), { replace: true });
      }
    } catch (currentError) {
      setError(currentError instanceof Error ? currentError.message : 'Error al iniciar sesión.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyTwoFa = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!challengeId) {
      return;
    }

    const sanitizedCode = codigo.replace(/\D/g, '').trim();
    if (sanitizedCode.length !== 6) {
      setError('El código debe contener 6 dígitos.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const user = await verifyTwoFa(challengeId, sanitizedCode);
      navigate(getDefaultDashboardPath(user.roles), { replace: true });
    } catch (currentError) {
      setError(currentError instanceof Error ? currentError.message : 'Error al validar el código 2FA.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid h-screen w-full overflow-hidden lg:grid-cols-2">
      <aside className="relative h-[40vh] lg:h-screen">
        {loginBackgrounds.map((imageSrc, index) => (
          <img
            key={imageSrc}
            src={imageSrc}
            alt="Fondo de acceso CRM TAMIVAR"
            className={[
              'absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-1000 ease-in-out',
              backgroundIndex === index ? 'opacity-100' : 'opacity-0',
            ].join(' ')}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/35 to-transparent" />
        <div className="absolute bottom-0 left-0 p-5 sm:p-6 lg:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-100/90">CRM TAMIVAR</p>
          <h2 className="mt-2 max-w-md text-xl font-black leading-tight text-white sm:text-2xl lg:text-3xl">
            Plataforma central para operar equipos y ventas.
          </h2>
          <p className="mt-2 max-w-md text-xs text-slate-200/90 sm:text-sm">
            Accede con tus credenciales y continúa con tu flujo de trabajo según tu rol.
          </p>
        </div>
      </aside>

      <section className="relative flex h-[60vh] items-center justify-center overflow-hidden bg-white px-5 py-6 sm:px-7 sm:py-8 lg:h-screen lg:items-center lg:py-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(25,75,141,0.10),transparent_55%)]" />
        <div className="relative w-full max-w-sm">
          <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">Iniciar sesión</h1>
          <p className="mt-1.5 text-sm text-slate-600">Ingresa para acceder al CRM TAMIVAR.</p>

          {!challengeId ? (
            <form className="mt-6 space-y-4" onSubmit={handleLogin}>
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-slate-700">Correo electrónico</span>
                <input
                  type="email"
                  required
                  value={correoElectronico}
                  onChange={(event) => setCorreoElectronico(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none ring-brand-700 transition focus:ring"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-slate-700">Contraseña</span>
                <input
                  type="password"
                  required
                  value={contrasena}
                  onChange={(event) => setContrasena(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none ring-brand-700 transition focus:ring"
                />
              </label>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60"
              >
                {isLoading ? 'Ingresando...' : 'Ingresar'}
              </button>
            </form>
          ) : (
            <form className="mt-6 space-y-4" onSubmit={handleVerifyTwoFa}>
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-slate-700">Código 2FA</span>
                <input
                  type="text"
                  required
                  minLength={6}
                  maxLength={6}
                  value={codigo}
                  onChange={(event) => setCodigo(event.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none ring-brand-700 transition focus:ring"
                />
              </label>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60"
              >
                {isLoading ? 'Validando...' : 'Validar código'}
              </button>
            </form>
          )}

          {info ? <p className="mt-4 rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-800">{info}</p> : null}
          {error ? <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p> : null}
        </div>
      </section>
    </div>
  );
}
