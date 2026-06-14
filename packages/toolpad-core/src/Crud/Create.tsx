'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import invariant from 'invariant';
import { useNotifications } from '../useNotifications';
import { CrudContext } from '../shared/context';
import { useLocaleText } from '../AppProvider/LocalizationProvider';
import { CrudForm, CrudFormSlotProps, CrudFormSlots } from './CrudForm';
import { DataSourceCache } from './cache';
import { useCachedDataSource } from './useCachedDataSource';
import { CRUD_DEFAULT_LOCALE_TEXT, type CRUDLocaleText } from './localeText';
import type { DataFieldFormValue, DataModel, DataSource, OmitId } from './types';
import { PageContainer, type PageContainerProps } from '../PageContainer';
import { useActivePage } from '../useActivePage';

export interface CreateProps<D extends DataModel> {
  /**
   * Server-side [data source](https://mui.com/toolpad/core/react-crud/#data-sources).
   */
  dataSource?: DataSource<D> & Required<Pick<DataSource<D>, 'createOne'>>;
  /**
   * Initial form values.
   * @default {}
   */
  initialValues?: Partial<OmitId<D>>;
  /**
   * Callback fired when the form is successfully submitted.
   */
  onSubmitSuccess?: (formValues: OmitId<D>) => void | Promise<void>;
  /**
   * Whether the form fields should reset after the form is submitted.
   * @default false
   */
  resetOnSubmit?: boolean;
  /**
   * [Cache](https://mui.com/toolpad/core/react-crud/#data-caching) for the data source.
   */
  dataSourceCache?: DataSourceCache | null;
  /**
   * The title of the page.
   */
  pageTitle?: string;
  /**
   * Locale text for the component.
   */
  localeText?: CRUDLocaleText;
  /**
   * The components used for each slot inside.
   * @default {}
   */
  slots?: {
    form?: CrudFormSlots;
    pageContainer?: React.JSXElementConstructor<PageContainerProps>;
  };
  /**
   * The props used for each slot inside.
   * @default {}
   */
  slotProps?: {
    form?: CrudFormSlotProps;
    pageContainer?: PageContainerProps;
  };
}

/**
 *
 * Demos:
 *
 * - [CRUD](https://mui.com/toolpad/core/react-crud/)
 *
 * API:
 *
 * - [Create API](https://mui.com/toolpad/core/api/create)
 */
function Create<D extends DataModel>(props: CreateProps<D>) {
  const {
    initialValues = {} as Partial<OmitId<D>>,
    onSubmitSuccess,
    resetOnSubmit = false,
    dataSourceCache,
    pageTitle,
    localeText: propsLocaleText,
    slots,
    slotProps,
  } = props;

  const globalLocaleText = useLocaleText();
  const localeText = { ...CRUD_DEFAULT_LOCALE_TEXT, ...globalLocaleText, ...propsLocaleText };

  const crudContext = React.useContext(CrudContext);
  const dataSource = (props.dataSource ?? crudContext.dataSource) as NonNullable<
    typeof props.dataSource
  >;

  const notifications = useNotifications();

  invariant(dataSource, 'No data source found.');

  const cache = React.useMemo(() => {
    const manualCache = dataSourceCache ?? crudContext.dataSourceCache;
    return typeof manualCache !== 'undefined' ? manualCache : new DataSourceCache();
  }, [crudContext.dataSourceCache, dataSourceCache]);
  const cachedDataSource = useCachedDataSource<D>(dataSource, cache) as NonNullable<
    typeof props.dataSource
  >;

  const { fields, createOne, validate } = cachedDataSource;

  const activePage = useActivePage();

  const [formState, setFormState] = React.useState<{
    values: Partial<OmitId<D>>;
    errors: Partial<Record<keyof D, string>>;
  }>(() => ({
    values: {
      ...Object.fromEntries(
        fields
          .filter(({ field, editable }) => field !== 'id' && editable !== false)
          .map(({ field, type }) => [
            field,
            type === 'boolean' ? (initialValues?.[field] ?? false) : initialValues?.[field],
          ]),
      ),
      ...initialValues,
    },
    errors: {},
  }));
  const formValues = formState.values;
  const formErrors = formState.errors;

  const setFormValues = React.useCallback((newFormValues: Partial<OmitId<D>>) => {
    setFormState((previousState) => ({
      ...previousState,
      values: newFormValues,
    }));
  }, []);

  const setFormErrors = React.useCallback((newFormErrors: Partial<Record<keyof D, string>>) => {
    setFormState((previousState) => ({
      ...previousState,
      errors: newFormErrors,
    }));
  }, []);

  const handleFormFieldChange = React.useCallback(
    (name: keyof D, value: DataFieldFormValue) => {
      const validateField = async (values: Partial<OmitId<D>>) => {
        if (validate) {
          const { issues } = await validate(values);
          setFormErrors({
            ...formErrors,
            [name]: issues?.find((issue) => issue.path?.[0] === name)?.message,
          });
        }
      };

      const newFormValues = { ...formValues, [name]: value };

      setFormValues(newFormValues);
      validateField(newFormValues);
    },
    [formErrors, formValues, setFormErrors, setFormValues, validate],
  );

  const handleFormReset = React.useCallback(() => {
    setFormValues(initialValues);
  }, [initialValues, setFormValues]);

  const handleFormSubmit = React.useCallback(async () => {
    // Check if all required fields are present
    const requiredFields = fields.filter(
      ({ field, editable }) => field !== 'id' && editable !== false,
    );
    const missingFields = requiredFields.filter(
      ({ field }) =>
        formValues[field] === undefined || formValues[field] === null || formValues[field] === '',
    );

    if (missingFields.length > 0) {
      const missingFieldErrors = Object.fromEntries(
        missingFields.map(({ field, headerName }) => [
          field as keyof D,
          `${headerName || field} is required`,
        ]),
      ) as Partial<Record<keyof D, string>>;
      setFormErrors(missingFieldErrors);
      throw new Error('Required fields are missing');
    }

    // At this point, we know all required fields are present, so we can safely cast to OmitId<D>
    const completeFormValues = formValues as unknown as OmitId<D>;

    if (validate) {
      const { issues } = await validate(completeFormValues);
      if (issues && issues.length > 0) {
        setFormErrors(Object.fromEntries(issues.map((issue) => [issue.path?.[0], issue.message])));
        throw new Error('Form validation failed');
      }
    }
    setFormErrors({});

    try {
      await createOne(completeFormValues);
      notifications.show(localeText.createSuccessMessage, {
        severity: 'success',
        autoHideDuration: 3000,
      });

      if (onSubmitSuccess) {
        await onSubmitSuccess(completeFormValues);
      }

      if (resetOnSubmit) {
        handleFormReset();
      }
    } catch (createError) {
      notifications.show(`${localeText.createErrorMessage} ${(createError as Error).message}`, {
        severity: 'error',
        autoHideDuration: 3000,
      });
      throw createError;
    }
  }, [
    createOne,
    fields,
    formValues,
    handleFormReset,
    localeText.createErrorMessage,
    localeText.createSuccessMessage,
    notifications,
    onSubmitSuccess,
    resetOnSubmit,
    setFormErrors,
    validate,
  ]);

  const PageContainerSlot = slots?.pageContainer ?? PageContainer;

  return (
    <PageContainerSlot
      title={pageTitle}
      breadcrumbs={
        activePage && pageTitle
          ? [
              ...activePage.breadcrumbs,
              {
                title: pageTitle,
              },
            ]
          : undefined
      }
      {...slotProps?.pageContainer}
    >
      <CrudForm
        dataSource={dataSource}
        formState={formState}
        onFieldChange={handleFormFieldChange}
        onSubmit={handleFormSubmit}
        onReset={handleFormReset}
        submitButtonLabel={localeText.createLabel}
        slots={slots?.form}
        slotProps={slotProps?.form}
      />
    </PageContainerSlot>
  );
}

Create.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * Server-side [data source](https://mui.com/toolpad/core/react-crud/#data-sources).
   */
  dataSource: PropTypes.object,
  /**
   * [Cache](https://mui.com/toolpad/core/react-crud/#data-caching) for the data source.
   */
  dataSourceCache: PropTypes.shape({
    cache: PropTypes.object.isRequired,
    clear: PropTypes.func.isRequired,
    get: PropTypes.func.isRequired,
    set: PropTypes.func.isRequired,
    ttl: PropTypes.number.isRequired,
  }),
  /**
   * Initial form values.
   * @default {}
   */
  initialValues: PropTypes.object,
  /**
   * Locale text for the component.
   */
  localeText: PropTypes.object,
  /**
   * Callback fired when the form is successfully submitted.
   */
  onSubmitSuccess: PropTypes.func,
  /**
   * The title of the page.
   */
  pageTitle: PropTypes.string,
  /**
   * Whether the form fields should reset after the form is submitted.
   * @default false
   */
  resetOnSubmit: PropTypes.bool,
  /**
   * The props used for each slot inside.
   * @default {}
   */
  slotProps: PropTypes.shape({
    form: PropTypes.shape({
      checkbox: PropTypes.object,
      datePicker: PropTypes.object,
      dateTimePicker: PropTypes.object,
      select: PropTypes.object,
      textField: PropTypes.object,
    }),
    pageContainer: PropTypes.object,
  }),
  /**
   * The components used for each slot inside.
   * @default {}
   */
  slots: PropTypes.shape({
    form: PropTypes.shape({
      checkbox: PropTypes.elementType,
      datePicker: PropTypes.elementType,
      dateTimePicker: PropTypes.elementType,
      select: PropTypes.elementType,
      textField: PropTypes.elementType,
    }),
    pageContainer: PropTypes.elementType,
  }),
} as any;

export { Create };
