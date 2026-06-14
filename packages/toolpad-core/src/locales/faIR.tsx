import type { LocaleText } from '../AppProvider';
import { getLocalization } from './getLocalization';

const faIRLabels: LocaleText = {
  // Account
  accountSignInLabel: 'ورود',
  accountSignOutLabel: 'خروج',

  // AccountPreview
  accountPreviewTitle: 'حساب کاربری',
  accountPreviewIconButtonLabel: 'کاربر فعلی',

  // SignInPage
  signInTitle: (brandingTitle?: string) =>
    brandingTitle ? `ورود به ${brandingTitle}` : 'ورود',
  signInSubtitle: 'کاربر گرامی، خوش آمدین، لطفا برای ادامه وارد حساب کاربری خود شوید',
  signInRememberMe: 'من را را به خاطر بسپار',
  providerSignInTitle: (provider: string) => `ورود با ${provider}`,

  // Common authentication labels
  email: 'رایانامه',
  password: 'گذرواژه',
  username: 'نام کاربری',
  passkey: 'گذرکلید یا کلید عبور',

  // Common action labels
  save: 'ذخیره',
  cancel: 'لغو',
  ok: 'تایید',
  or: 'یا',
  to: 'به',
  with: 'با',
  close: 'بستن',
  delete: 'حذف',
  alert: 'هشدار',
  confirm: 'تایید',
  loading: 'بارگیری...',

  // CRUD
  createNewButtonLabel: 'ایجاد مورد جدید',
  reloadButtonLabel: 'بارگیری مجدد داده‌ها',
  createLabel: 'ایجاد',
  createSuccessMessage: 'مورد فوق با موفقیت ایجاد شد.',
  createErrorMessage: 'ایجاد مورد فوق ناموفق بود. به دلیل:',
  editLabel: 'ویرایش',
  editSuccessMessage: 'مورد فوق با موفیقت ویرایش شد.',
  editErrorMessage: 'ایجاد مورد فوق ناموفق بود. به دلیل:',
  deleteLabel: 'حذف',
  deleteConfirmTitle: 'حذف مورد?',
  deleteConfirmMessage: 'آیا مایل به حذف این مورد هستید؟',
  deleteConfirmLabel: 'حذف',
  deleteCancelLabel: 'لغو',
  deleteSuccessMessage: 'مورد با موفقیت حذف شد.',
  deleteErrorMessage: 'حذف مورد ناموفق بود. به دلیل:',
  deletedItemMessage: 'این مورد حذف شده است.',
};

export default getLocalization(faIRLabels);
