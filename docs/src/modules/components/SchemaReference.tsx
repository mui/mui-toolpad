import * as React from 'react';
import MarkdownElement from '@mui/monorepo/docs/src/modules/components/MarkdownElement';
import AppLayoutDocs from '@mui/monorepo/docs/src/modules/components/AppLayoutDocs';
import Ad from '@mui/monorepo/docs/src/modules/components/Ad';
import { JSONSchema7, JSONSchema7Definition } from 'json-schema';
import { Typography, Divider, styled } from '@mui/material';
import invariant from 'invariant';
import { interleave } from '../utils/react';

const Wrapper = styled('div')(({ theme }) => ({
  '& .definition': {
    display: 'flex',
    flexDirection: 'row',
  },
  '& .definition-term': {
    flexShrink: 0,
  },
  '& .definition-definition': {
    marginLeft: theme.spacing(1),
  },
  '& .indent': {
    marginLeft: theme.spacing(2),
  },
}));

export interface SchemaReferenceProps {
  disableAd?: boolean;
  definitions: JSONSchema7;
}

interface JsonSchemaTypeDisplayProps {
  schema: JSONSchema7;
}

function JsonSchemaTypeDisplay({ schema }: JsonSchemaTypeDisplayProps) {
  let types: string[] = [];
  if (schema.type) {
    types = Array.isArray(schema.type) ? schema.type : [schema.type];
  } else if (!schema.anyOf) {
    types = ['any'];
  }
  return (
    <React.Fragment>
      {types.map((type) => {
        const typeId = type ?? 'any';
        return (
          <React.Fragment key={typeId}>
            <strong>type:</strong> <code>{typeId}</code>
          </React.Fragment>
        );
      })}
    </React.Fragment>
  );
}

interface JsonSchemaDisplayProps {
  name?: string;
  schema: JSONSchema7Definition;
  idPrefix?: string;
}

function JsonSchemaDisplay({ name, schema, idPrefix = '' }: JsonSchemaDisplayProps) {
  invariant(typeof schema === 'object', `Expected an object but got ${typeof schema}`);

  if (schema.$ref) {
    if (schema.$ref.startsWith('#/definitions/')) {
      const definition = schema.$ref.slice('#/definitions/'.length);
      if (!definition.includes('/')) {
        const hash = `definition-${definition}`;
        return (
          <div>
            {name ? <code>{name}</code> : null}
            <a aria-labelledby={hash} className="anchor-link" href={`#${hash}`} tabIndex={-1}>
              {definition}
            </a>
          </div>
        );
      }
    }
  }

  const properties: [string, JSONSchema7Definition][] = [];

  if (schema.properties) {
    properties.push(...Object.entries(schema.properties));
  }

  if (schema.additionalProperties) {
    properties.push(['*', schema.additionalProperties]);
  }

  const id = `${idPrefix}-${name || ''}`;

  return (
    <Wrapper>
      {name ? (
        <a href={`#${id}`} tabIndex={-1}>
          <code id={id}>{name}</code>
        </a>
      ) : null}
      {schema.description ? (
        <div className="definition">
          <div className="definition-term">
            <strong>Description:</strong>
          </div>
          <div className="definition-definition">{schema.description}</div>
        </div>
      ) : null}

      <JsonSchemaTypeDisplay schema={schema} />

      {properties.length > 0 ? (
        <div>
          <strong>Properties:</strong>
          <div className="indent">
            {interleave(
              properties.map(([propName, propSchema]) => {
                return (
                  <JsonSchemaDisplay
                    key={propName}
                    name={propName}
                    schema={propSchema}
                    idPrefix={id}
                  />
                );
              }),
              <Divider sx={{ m: `8px 0 !important` }} />,
            )}
          </div>
        </div>
      ) : null}

      {schema.items ? (
        <div>
          <strong>Items:</strong>
          <div className="indent">
            {Array.isArray(schema.items) ? (
              <ul>
                {schema.items.map((item, i) => (
                  <li key={i}>
                    <JsonSchemaDisplay schema={item} idPrefix={id} />
                  </li>
                ))}
              </ul>
            ) : (
              <JsonSchemaDisplay schema={schema.items} idPrefix={id} />
            )}
          </div>
        </div>
      ) : null}

      {schema.anyOf ? (
        <React.Fragment>
          <strong>Must be any of:</strong>
          <ul>
            {schema.anyOf.map((subSchema, i) => {
              return (
                <li key={i}>
                  <JsonSchemaDisplay schema={subSchema} idPrefix={id} />
                </li>
              );
            })}
          </ul>
        </React.Fragment>
      ) : null}
    </Wrapper>
  );
}

interface HeadingProps {
  hash: string;
  level: 'h2' | 'h3';
  title: string;
}

function Heading({ hash, level: Level, title }: HeadingProps) {
  return (
    <Level id={hash}>
      {title}
      <a aria-labelledby={hash} className="anchor-link" href={`#${hash}`} tabIndex={-1}>
        <svg>
          <use xlinkHref="#anchor-link-icon" />
        </svg>
      </a>
    </Level>
  );
}

export default function SchemaReference({ disableAd, definitions }: SchemaReferenceProps) {
  const toc = [
    {
      text: 'Files',
      hash: 'files',
      introduction: `These are the various files supported by toolpad.`,
      children: Object.entries(definitions.properties || {}).map(([name, content]) => ({
        text: name,
        hash: `file-${name}`,
        content,
        children: [],
      })),
    },
    {
      text: 'Definitions',
      hash: 'definitions',
      introduction: `These are shared definitions used throughout Toolpad files.`,
      children: Object.entries(definitions.definitions || {}).map(([name, content]) => ({
        text: name,
        hash: `definition-${name}`,
        content,
        children: [],
      })),
    },
  ];

  const description = 'An exhaustive reference for the Toolpad file formats.';

  return (
    <AppLayoutDocs
      description={description}
      disableAd={disableAd}
      disableToc={false}
      location="hello"
      title={`Schema Reference`}
      toc={toc}
    >
      <MarkdownElement>
        <h1>Schema Reference</h1>

        <Typography
          variant="h5"
          component="p"
          className={`description${disableAd ? '' : ' ad'}`}
          gutterBottom
        >
          {description}
          {disableAd ? null : <Ad />}
        </Typography>

        {toc.map((tocNode) => {
          return (
            <React.Fragment key={tocNode.hash}>
              <Heading hash={tocNode.hash} level="h2" title={tocNode.text} />

              <Typography>{tocNode.introduction}</Typography>

              {tocNode.children.map((tocItemNode) => {
                return (
                  <React.Fragment key={tocItemNode.hash}>
                    <Heading hash={tocItemNode.hash} level="h3" title={tocItemNode.text} />
                    <JsonSchemaDisplay schema={tocItemNode.content} idPrefix={tocItemNode.hash} />
                  </React.Fragment>
                );
              })}
            </React.Fragment>
          );
        })}
      </MarkdownElement>
      <svg style={{ display: 'none' }} xmlns="http://www.w3.org/2000/svg">
        <symbol id="anchor-link-icon" viewBox="0 0 16 16">
          <path d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z" />
        </symbol>
      </svg>
    </AppLayoutDocs>
  );
}
