const env: TemplateFile = {
  content: `
# Generate a secret with \`npx auth secret\`
# and replace the value below with it
AUTH_SECRET=secret
`,
};

export default env;
