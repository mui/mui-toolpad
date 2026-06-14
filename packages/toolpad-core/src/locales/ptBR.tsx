import type { LocaleText } from '../AppProvider';
import { getLocalization } from './getLocalization';

const enLabels: LocaleText = {
  // Account
  accountSignInLabel: 'Entrar',
  accountSignOutLabel: 'Sair',

  // AccountPreview
  accountPreviewTitle: 'Conta',
  accountPreviewIconButtonLabel: 'Usuário atual',

  // SignInPage
  signInTitle: (brandingTitle?: string) =>
    brandingTitle ? `Entrar em ${brandingTitle}` : 'Entrar',
  signInSubtitle: 'Bem-vindo, usuário. Faça login para continuar.',
  signInRememberMe: 'Lembrar-me',
  providerSignInTitle: (provider: string) => `Entrar com ${provider}`,

  // Common authentication labels
  email: 'E-mail',
  password: 'Senha',
  username: 'Nome de usuário',
  passkey: 'Chave de acesso',

  // Common action labels
  save: 'Salvar',
  cancel: 'Cancelar',
  ok: 'Ok',
  or: 'Ou',
  to: 'Para',
  with: 'Com',
  close: 'Fechar',
  delete: 'Deletar',
  alert: 'Alertar',
  confirm: 'Confirmar',
  loading: 'Carregando...',

  // CRUD
  createNewButtonLabel: 'Criar novo',
  reloadButtonLabel: 'Recarregar dados',
  createLabel: 'Criar',
  createSuccessMessage: 'Item criado com sucesso.',
  createErrorMessage: 'Falha ao criar item. Motivo:',
  editLabel: 'Editar',
  editSuccessMessage: 'Item editado com sucesso.',
  editErrorMessage: 'Falha ao editar item. Motivo:',
  deleteLabel: 'Excluir',
  deleteConfirmTitle: 'Excluir item?',
  deleteConfirmMessage: 'Deseja excluir este item?',
  deleteConfirmLabel: 'Excluir',
  deleteCancelLabel: 'Cancelar',
  deleteSuccessMessage: 'Item excluído com sucesso.',
  deleteErrorMessage: 'Falha ao excluir o item. Motivo:',
  deletedItemMessage: 'Este item foi excluído.',
};

export default getLocalization(enLabels);