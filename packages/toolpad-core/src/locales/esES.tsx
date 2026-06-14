import type { LocaleText } from '../AppProvider';
import { getLocalization } from './getLocalization';

const esLabels: LocaleText = {
  // Account
  accountSignInLabel: 'Iniciar sesión',
  accountSignOutLabel: 'Cerrar sesión',

  // AccountPreview
  accountPreviewTitle: 'Cuenta',
  accountPreviewIconButtonLabel: 'Usuario actual',

  // SignInPage
  signInTitle: (brandingTitle?: string) =>
    brandingTitle ? `Iniciar sesión en ${brandingTitle}` : 'Iniciar sesión',
  signInSubtitle: 'Bienvenido usuario, por favor inicie sesión para continuar',
  signInRememberMe: 'Recordarme',
  providerSignInTitle: (provider: string) => `Iniciar sesión con ${provider}`,

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

  // CRUD
  createNewButtonLabel: 'Crear nuevo',
  reloadButtonLabel: 'Recargar datos',
  createLabel: 'Crear',
  createSuccessMessage: 'Elemento creado exitosamente.',
  createErrorMessage: 'Error al crear el elemento. Razón:',
  editLabel: 'Editar',
  editSuccessMessage: 'Elemento editado exitosamente.',
  editErrorMessage: 'Error al editar el elemento. Razón:',
  deleteLabel: 'Eliminar',
  deleteConfirmTitle: '¿Eliminar elemento?',
  deleteConfirmMessage: '¿Desea eliminar este elemento?',
  deleteConfirmLabel: 'Eliminar',
  deleteCancelLabel: 'Cancelar',
  deleteSuccessMessage: 'Elemento eliminado exitosamente.',
  deleteErrorMessage: 'Error al eliminar el elemento. Razón:',
  deletedItemMessage: 'Este elemento ha sido eliminado.',
};

export default getLocalization(esLabels);