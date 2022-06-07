import { Button, MenuItem, Stack, TextField, Toolbar } from '@mui/material';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import data from '../../../movies.json';
import { ClientDataSource, ConnectionEditorProps } from '../../types';
import { validation } from '../../utils/forms';
import { Maybe, WithControlledProp } from '../../utils/types';
import { MoviesQuery, MoviesConnectionParams } from './types';

function withDefaults(value: Maybe<MoviesConnectionParams>): MoviesConnectionParams {
  return {
    apiKey: '',
    ...value,
  };
}

function ConnectionParamsInput({ value, onChange }: ConnectionEditorProps<MoviesConnectionParams>) {
  const { handleSubmit, register, formState, reset } = useForm({
    defaultValues: withDefaults(value),
  });
  React.useEffect(() => reset(withDefaults(value)), [reset, value]);

  const doSubmit = handleSubmit((connectionParams) => onChange(connectionParams));

  return (
    <Stack direction="column" gap={1}>
      <Toolbar disableGutters>
        <Button onClick={doSubmit} disabled={!formState.isDirty || !formState.isValid}>
          Save
        </Button>
      </Toolbar>
      <TextField
        label="API key"
        {...register('apiKey', { required: true })}
        {...validation(formState, 'apiKey')}
      />
    </Stack>
  );
}

function isValid(connection: MoviesConnectionParams): boolean {
  return !!connection.apiKey;
}

export function QueryEditor({ value, onChange }: WithControlledProp<MoviesQuery>) {
  const handleChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onChange({ ...value, genre: event.target.value || null });
    },
    [value, onChange],
  );
  return (
    <Stack>
      <TextField select fullWidth value={value.genre || ''} label="Genre" onChange={handleChange}>
        <MenuItem value={''}>Any</MenuItem>
        {data.genres.map((genre) => (
          <MenuItem key={genre} value={genre}>
            {genre}
          </MenuItem>
        ))}
      </TextField>
    </Stack>
  );
}

function getInitialQueryValue(): MoviesQuery {
  return { genre: null };
}

const dataSource: ClientDataSource<MoviesConnectionParams, MoviesQuery> = {
  displayName: 'Fake Movies API',
  ConnectionParamsInput,
  isConnectionValid: isValid,
  QueryEditor,
  getInitialQueryValue,
};

export default dataSource;
