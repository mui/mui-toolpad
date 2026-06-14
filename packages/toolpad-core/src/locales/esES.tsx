import type { LocaleText } from '../AppProvider';
import { getLocalization } from './getLocalization';

const esESLabels: Partial<LocaleText> = {
  // Account
  accountSignInLabel: 'Iniciar sesión',
  accountSignOutLabel: 'Cerrar sesión',

  // AccountPreview
  accountPreviewTitle: 'Cuenta',
  accountPreviewIconButtonLabel: 'Usuario actual',

  // SignInPage
  signInTitle: 'Iniciar sesión',
  signInSubtitle: 'Bienvenido/a, inicia sesión para continuar',
  signInRememberMe: 'Recuérdame',
  oauthSignInTitle: 'Inicia sesión con OAuth',
  passkeySignInTitle: 'Inicia sesión con Clave de acceso',
  magicLinkSignInTitle: 'Inicia sesión con Magic Link',

  // Common authentication labels
  email: 'Correo electrónico',
  password: 'Contraseña',
  username: 'Nombre de usuario',
  passkey: 'Clave de acceso',

  // Common action labels
  save: 'Guardar',
  cancel: 'Cancelar',
  ok: 'Aceptar',
  or: 'O',
  to: 'A',
  with: 'Con',
  close: 'Cerrar',
  delete: 'Eliminar',
  alert: 'Alerta',
  confirm: 'Confirmar',
  loading: 'Cargando...',
};

export default getLocalization(esESLabels);
