import { TextField, MenuItem, SxProps } from '@mui/material';
import * as React from 'react';
import { NodeId } from '@mui/toolpad-core';
import * as appDom from '../../../appDom';
import { Maybe, WithControlledProp } from '../../../utils/types';
import { useDom } from '../../DomLoader';
import dataSources from '../../../toolpadDataSources/client';
import { asArray } from '../../../utils/collections';
import envConfig from '../../../config';
import { FETCH_CONNECTION_TEMPLATES } from '../../../toolpadDataSources/rest/templates';

export type ConnectionOption = {
  connectionId: NodeId | null;
  dataSourceId: string;
  templateName?: string;
};

export interface ConnectionSelectProps extends WithControlledProp<ConnectionOption | null> {
  dataSource?: Maybe<string | string[]>;
  sx?: SxProps;
}

export default function ConnectionSelect({
  sx,
  dataSource,
  value,
  onChange,
}: ConnectionSelectProps) {
  const dom = useDom();

  const app = appDom.getApp(dom);
  const { connections = [] } = appDom.getChildNodes(dom, app);

  const options: ConnectionOption[] = React.useMemo(() => {
    const filteredSources = new Set(asArray(dataSource));
    const result: ConnectionOption[] = [];

    for (const [dataSourceId, config] of Object.entries(dataSources)) {
      if (config?.hasDefault && (!envConfig.isDemo || config.isDemoFeature)) {
        if (!dataSource || filteredSources.has(dataSourceId)) {
          result.push({
            dataSourceId,
            connectionId: null,
          });
        }
      }
    }

    for (const connection of connections) {
      const connectionDataSourceId = connection.attributes.dataSource.value;
      if (!dataSource || filteredSources.has(connectionDataSourceId)) {
        const connectionDataSource = dataSources[connectionDataSourceId];
        if (connectionDataSource) {
          result.push({
            connectionId: connection.id,
            dataSourceId: connectionDataSourceId,
          });
        }
      }
    }

    if (envConfig.isDemo) {
      for (const [templateName] of FETCH_CONNECTION_TEMPLATES.entries()) {
        result.push({
          dataSourceId: 'rest',
          connectionId: null,
          templateName,
        });
      }

      result.push({
        dataSourceId: 'movies',
        connectionId: null,
      });
    }

    return result;
  }, [connections, dataSource]);

  const handleSelectionChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const index = Number(event.target.value);
      onChange(options[index] || null);
    },
    [onChange, options],
  );

  const selection = React.useMemo(() => {
    if (!value) {
      return '';
    }
    return String(
      options.findIndex(
        (option) =>
          option.connectionId === value.connectionId &&
          option.dataSourceId === value.dataSourceId &&
          option.templateName === value.templateName,
      ),
    );
  }, [options, value]);

  return (
    <TextField
      sx={sx}
      select
      fullWidth
      value={selection}
      label="Connection"
      onChange={handleSelectionChange}
    >
      {options.map((option, index) => {
        const config = dataSources[option.dataSourceId];
        const dataSourceLabel = config
          ? config.displayName
          : `<unknown datasource "${option.dataSourceId}">`;

        const defaultConnectionLabel = config?.isSingleQuery
          ? ''
          : option.templateName || '<default>';

        const connectionLabel = option.connectionId
          ? appDom.getMaybeNode(dom, option.connectionId)?.name
          : defaultConnectionLabel;
        return (
          <MenuItem key={index} value={index}>
            {dataSourceLabel} {connectionLabel ? `| ${connectionLabel}` : ''}
          </MenuItem>
        );
      })}
    </TextField>
  );
}
