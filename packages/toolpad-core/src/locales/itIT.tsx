import type { LocaleText } from '../AppProvider';
import { getLocalization } from './getLocalization';

const itLabels: LocaleText = {
  // Account
  accountSignInLabel: 'Accedi',
  accountSignOutLabel: 'Esci',

  // AccountPreview
  accountPreviewTitle: 'Account',
  accountPreviewIconButtonLabel: 'Utente corrente',

  // SignInPage
  signInTitle: (brandingTitle?: string) =>
    brandingTitle ? `Accedi a ${brandingTitle}` : 'Accedi',
  signInSubtitle: 'Benvenuto, effettua l\'accesso per continuare',
  signInRememberMe: 'Ricordami',
  providerSignInTitle: (provider: string) => `Accedi con ${provider}`,

  // Common authentication labels
  email: 'Email',
  password: 'Password',
  username: 'Nome utente',
  passkey: 'Passkey',

  // Common action labels
  save: 'Salva',
  cancel: 'Annulla',
  ok: 'OK',
  or: 'O',
  to: 'A',
  with: 'Con',
  close: 'Chiudi',
  delete: 'Elimina',
  alert: 'Avviso',
  confirm: 'Conferma',
  loading: 'Caricamento...',

  // CRUD
  createNewButtonLabel: 'Crea nuovo',
  reloadButtonLabel: 'Ricarica dati',
  createLabel: 'Crea',
  createSuccessMessage: 'Elemento creato con successo.',
  createErrorMessage: 'Errore durante la creazione dell\'elemento. Motivo:',
  editLabel: 'Modifica',
  editSuccessMessage: 'Elemento modificato con successo.',
  editErrorMessage: 'Errore durante la modifica dell\'elemento. Motivo:',
  deleteLabel: 'Elimina',
  deleteConfirmTitle: 'Eliminare l\'elemento?',
  deleteConfirmMessage: 'Vuoi eliminare questo elemento?',
  deleteConfirmLabel: 'Elimina',
  deleteCancelLabel: 'Annulla',
  deleteSuccessMessage: 'Elemento eliminato con successo.',
  deleteErrorMessage: 'Errore durante l\'eliminazione dell\'elemento. Motivo:',
  deletedItemMessage: 'Questo elemento è stato eliminato.',
};

export default getLocalization(itLabels);