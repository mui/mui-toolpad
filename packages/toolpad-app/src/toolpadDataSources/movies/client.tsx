import {
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack,
  TextField,
  Toolbar,
} from '@mui/material';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import data from '../../../movies.json';
import { ClientDataSource, ConnectionEditorProps, QueryEditorProps } from '../../types';
import { isSaveDisabled, validation } from '../../utils/forms';
import { Maybe } from '../../utils/types';
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
        <Button onClick={doSubmit} disabled={isSaveDisabled(formState)}>
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

export function QueryEditor({
  value,
  onChange,
}: QueryEditorProps<MoviesConnectionParams, MoviesQuery>) {
  const handleChange = React.useCallback(
    (event: SelectChangeEvent<string>) => {
      onChange({ ...value, genre: event.target.value || null });
    },
    [value, onChange],
  );
  return (
    <Stack>
      <FormControl fullWidth>
        <InputLabel id="select-movie-genre">Genre</InputLabel>
        <Select
          labelId="select-movie-genre"
          value={value.genre || ''}
          label="Genre"
          onChange={handleChange}
        >
          <MenuItem value={''}>Any</MenuItem>
          {data.genres.map((genre) => (
            <MenuItem key={genre} value={genre}>
              {genre}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
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
