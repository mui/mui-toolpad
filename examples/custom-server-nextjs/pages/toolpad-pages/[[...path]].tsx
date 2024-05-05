import * as React from 'react';
import ToolpadAppClient from '@toolpad/studio/next-client';

export async function getServerSideProps() {
  const { default: project } = await import('../../toolpad-server');
  return project.getServerSideProps();
}

export default function Toolpad(props) {
  return (
    <ToolpadAppClient
      {...props}
      apiUrl="/my-next-app/api/toolpad"
      basename="/my-next-app/toolpad-pages"
    />
  );
}
