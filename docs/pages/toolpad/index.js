import * as React from 'react';
import NoSsr from '@mui/material/NoSsr';
import Head from 'docs/src/modules/components/Head';
import CssBaseline from '@mui/material/CssBaseline';
import Divider from '@mui/material/Divider';
import BrandingCssVarsProvider from 'docs/src/BrandingCssVarsProvider';
import AppHeader from 'docs/src/layouts/AppHeader';
import AppFooter from 'docs/src/layouts/AppFooter';
import AppHeaderBanner from 'docs/src/components/banner/AppHeaderBanner';
import Hero from '../../src/components/landing/Hero';
import HeroVideo from '../../src/components/landing/HeroVideo';
import SignUpToast from '../../src/components/landing/SignUpToast';
import UseCases from '../../src/components/landing/UseCases';
import CardGrid from '../../src/components/landing/CardGrid';
import Pricing from '../../src/components/landing/PricingTable';
import Marquee from '../../src/components/landing/Marquee';
import features from '../../data/toolpad/landing/features';
import useCases from '../../data/toolpad/landing/useCases';
import marquee from '../../data/toolpad/landing/marquee';
import {
  Headline,
  plans,
  planInfo,
  rowHeaders,
  communityData,
  commercialData,
} from '../../data/toolpad/landing/pricing';

export default function Home() {
  return (
    <BrandingCssVarsProvider>
      <Head
        title="MUI Toolpad: Low-code, admin builder"
        description="Build apps with MUI components, connect to data sources, APIs and build your internal tools 10x faster. Open-source and powered by MUI."
        card="https://deploy-preview-2380--mui-toolpad-docs.netlify.app/static/toolpad/marketing/social-preview.jpg"
      />
      <NoSsr>
        <SignUpToast />
      </NoSsr>
      <CssBaseline />
      <AppHeaderBanner />
      <AppHeader gitHubRepository="https://github.com/mui/mui-toolpad" />
      <main id="main-content">
        <Hero />
        <HeroVideo />
        <Divider />
        <UseCases content={useCases} />
        <Divider />
        <CardGrid content={features} />
        <Divider />
        <Pricing
          Headline={Headline}
          plans={plans}
          planInfo={planInfo}
          rowHeaders={rowHeaders}
          commercialData={commercialData}
          communityData={communityData}
        />
        <Divider />
        <Marquee content={marquee} />
        <Divider />
      </main>
      <AppFooter />
    </BrandingCssVarsProvider>
  );
}
