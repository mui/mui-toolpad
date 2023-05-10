import type { MuiPage } from '@mui/monorepo/docs/src/MuiPage';

const pages: MuiPage[] = [
  {
    pathname: '/toolpad/getting-started',
    icon: 'DescriptionIcon',
    children: [
      { pathname: '/toolpad/getting-started/overview' },
      { pathname: '/toolpad/getting-started/quickstart' },
      { pathname: '/toolpad/getting-started/installation' },
      { pathname: '/toolpad/getting-started/roadmap' },
    ],
  },
  {
    pathname: '/toolpad/connecting-to-datasources',
    icon: 'TableViewIcon',
    children: [
      {
        pathname: '/toolpad/connecting-to-datasources/queries',
      },
      {
        pathname: '/toolpad/connecting-to-datasources/serverside-http-request',
        title: 'Serverside HTTP requests',
      },
      {
        pathname: '/toolpad/connecting-to-datasources/serverside-javascript',
        title: 'Serverside JavaScript',
      },
    ],
  },
  {
    pathname: '/toolpad/building-ui',
    title: 'Building UI',
    icon: 'VisibilityIcon',
    children: [
      {
        pathname: '/toolpad/building-ui/component-library',
        title: 'Component library',
      },
      {
        pathname: '/toolpad/building-ui/canvas-and-inspector',
        title: 'Canvas & Inspector',
      },
      {
        pathname: '/toolpad/building-ui/custom-components',
        title: 'Custom components',
      },
      {
        pathname: '/toolpad/building-ui/data-grid-component',
        title: 'Data Grid component',
      },
    ],
  },
  {
    pathname: '/toolpad/data-binding',
    icon: 'CodeIcon',
  },
  {
    pathname: '/toolpad/deployment',
    icon: 'BuildIcon',
  },
  {
    pathname: '/toolpad/examples',
    icon: 'DescriptionIcon',
    children: [
      { pathname: '/toolpad/examples/user-admin-app' },
      { pathname: '/toolpad/examples/chatGPT' },
    ],
  },
  // {
  //   pathname: '/toolpad/versioning-and-deploying',
  //   title: 'Versioning & deploying [TODO]',
  //   icon: 'ToggleOnIcon',
  //   children: [
  //     {
  //       pathname: '/toolpad/versioning-and-deploying/releases',
  //     },
  //   ],
  // },
  // {
  //   pathname: '/toolpad/faq',
  //   title: 'FAQ [TODO]',
  //   icon: 'ReaderIcon',
  // },
];

export default pages;
