import React from 'react';

type OnCloseType = (...args: unknown[]) => void | Promise<void>;

interface UseUnsavedChangesConfirmInput {
  hasUnsavedChanges: boolean;
  onClose: OnCloseType;
}

interface UseUnsavedChangesConfirmPayload {
  handleCloseWithUnsavedChanges: OnCloseType;
}

export default function useUnsavedChangesConfirm({
  hasUnsavedChanges,
  onClose,
}: UseUnsavedChangesConfirmInput): UseUnsavedChangesConfirmPayload {
  const handleCloseWithUnsavedChanges = React.useCallback(() => {
    if (hasUnsavedChanges) {
      // eslint-disable-next-line no-alert
      const hasConfirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to navigate away?\nAll changes will be discarded.',
      );

      if (!hasConfirmed) {
        return;
      }
    }

    onClose();
  }, [hasUnsavedChanges, onClose]);

  return { handleCloseWithUnsavedChanges };
}
