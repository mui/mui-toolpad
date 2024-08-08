import * as React from 'react';
import {
  IconButton,
  Tooltip,
  Stack,
  Typography,
  styled,
  InputAdornment,
  TextField,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
// import ClearIcon from '@mui/icons-material/Clear';

interface ExplorerHeaderProps {
  headerText: string;
  headerIcon?: React.ReactNode;
  createLabelText?: string;
  onCreate?: React.MouseEventHandler<HTMLButtonElement>;
  searchLabelText?: string;
  onSearch?: (searchTerm: string) => void | Promise<void>;
  hasPersistentSearch?: boolean;
}

const ExplorerHeaderContainer = styled(Stack)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  width: '100%',
  height: 36,
}));

const ExplorerHeaderTitle = styled(Typography)(({ theme }) => ({
  fontSize: 13,
  flexGrow: 1,
  fontWeight: theme.typography.fontWeightLight,
}));

export default function ExplorerHeader({
  headerText,
  headerIcon,
  onCreate,
  onSearch,
  createLabelText,
  searchLabelText = 'Search',
  hasPersistentSearch = false,
}: ExplorerHeaderProps) {
  const [isSearching, setIsSearching] = React.useState(false || hasPersistentSearch);
  const [searchTerm, setSearchTerm] = React.useState('');

  const handleSearchClick = React.useCallback(() => {
    if (isSearching && searchTerm) {
      setSearchTerm('');
    }

    setIsSearching((previousIsSearching) => !previousIsSearching);
  }, [isSearching, searchTerm]);

  const handleSearchChange = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  }, []);

  // const handleClearSearch = React.useCallback(() => {
  //   setSearchTerm('');
  // }, []);

  React.useEffect(() => {
    if (onSearch) {
      onSearch(searchTerm);
    }
  }, [onSearch, searchTerm]);

  return (
    <ExplorerHeaderContainer
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      sx={{ pl: isSearching ? 2 : 2.5 }}
    >
      {isSearching ? (
        <TextField
          hiddenLabel
          value={searchTerm}
          onChange={handleSearchChange}
          variant="standard"
          fullWidth
          size="small"
          placeholder={`${searchLabelText}…`}
          slotProps={{
            input: {
              startAdornment: hasPersistentSearch ? (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ mt: '-4px' }} />
                </InputAdornment>
              ) : null,
              sx: {
                fontSize: 14,
                borderRadius: 0,
              },
            },
          }}
        />
      ) : (
        <React.Fragment>
          {headerIcon}
          <ExplorerHeaderTitle
            variant="body2"
            sx={{
              mx: 0.5,
              my: 0.5,
            }}
          >
            {headerText}
          </ExplorerHeaderTitle>
        </React.Fragment>
      )}
      {onSearch && searchLabelText && !hasPersistentSearch ? (
        <Tooltip title={searchLabelText}>
          <IconButton aria-label={searchLabelText} size="medium" onClick={handleSearchClick}>
            <SearchIcon color={isSearching ? 'primary' : 'inherit'} />
          </IconButton>
        </Tooltip>
      ) : null}
      {onCreate && createLabelText ? (
        <Tooltip title={createLabelText}>
          <IconButton aria-label={createLabelText} size="small" onClick={onCreate}>
            <AddIcon />
          </IconButton>
        </Tooltip>
      ) : null}
    </ExplorerHeaderContainer>
  );
}
