import type { LocaleText } from '../AppProvider';
import { getLocalization } from './getLocalization';

const caESLabels: Partial<LocaleText> = {
  // Account
  accountSignInLabel: 'Iniciar sessió',
  accountSignOutLabel: 'Tancar sessió',

  // AccountPreview
  accountPreviewTitle: 'Compte',
  accountPreviewIconButtonLabel: 'Usuari actual',

  // SignInPage
  signInTitle: 'Iniciar sessió',
  signInSubtitle: 'Benvingut/da, inicia sessió per continuar',
  signInRememberMe: "Recorda'm",
  oauthSignInTitle: 'Inicia sessió amb OAuth',
  passkeySignInTitle: "Inicia sessió amb Clau d'accés",
  magicLinkSignInTitle: 'Inicia sessió amb Magic Link',

  // Common authentication labels
  email: 'Correu electrònic',
  password: 'Contrasenya',
  username: "Nom d'usuari",
  passkey: "Clau d'accés",

  // Common action labels
  save: 'Desa',
  cancel: 'Cancel·la',
  ok: "D'acord",
  or: 'O',
  to: 'A',
  with: 'Amb',
  close: 'Tanca',
  delete: 'Suprimeix',
  alert: 'Alerta',
  confirm: 'Confirma',
  loading: 'Carregant...',
};

export default getLocalization(caESLabels);
