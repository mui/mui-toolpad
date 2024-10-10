# Toolpad Core - Next.js App Router

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Setting up

The project requires an `.env.local` with the following variables:

```bash
AUTH_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
```

### AUTH_SECRET

`AUTH_SECRET` is a random value used by the Auth.js to encrypt tokens and email verification hashes. (See [Deployment](https://authjs.dev/getting-started/deployment) to learn more). You can generate one via running:

```bash
npx auth secret
```

### GitHub configuration

To get the required credentials from GitHub, we need to create an application in their developer settings. Read this [detailed guide on Auth.js](https://authjs.dev/guides/configuring-github) on how to obtain those.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
