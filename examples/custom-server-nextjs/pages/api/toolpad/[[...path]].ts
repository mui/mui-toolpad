import project from '../../../toolpad-server';

export const config = {
  api: {
    externalResolver: true,
    bodyParser: false,
  },
};

export default project.createApiHandler({ base: '/api/toolpad' });
