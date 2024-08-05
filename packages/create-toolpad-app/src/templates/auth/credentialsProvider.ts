const credentialsProvider: TemplateFile = {
  content: `
  Credentials({
    credentials: {
      email: { label: 'Email Address', type: 'email' },
      password: { label: 'Password', type: 'password' },
    },
    authorize(c) {
      if (c.password !== 'password') {      
        return null;
      }
      return {
        id: 'test',
        name: 'Test User',
        email: 'test@example.com',
      };
    },
  }),`,
};

export default credentialsProvider;
