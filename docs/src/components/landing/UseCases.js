import * as React from 'react';
import Link from '@mui/material/Link';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import KeyboardArrowRightRounded from '@mui/icons-material/KeyboardArrowRightRounded';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Unstable_Grid2';
import SectionHeadline from 'docs/src/components/typography/SectionHeadline';

export default function CardGrid(props) {
  const { content } = props;
  return (
    <Box
      sx={[
        (theme) => ({
          background: `radial-gradient(140% 150% at 50% 10%, transparent 50%,  ${theme.palette.primary[100]} 90%,  transparent 100%)`,
          ...theme.applyDarkStyles({
            background: `radial-gradient(140% 150% at 50% 10%, transparent 40%,  ${theme.palette.primary[700]} 90%,  transparent 100%)`,
          }),
        }),
      ]}
    >
      <Container sx={{ py: { xs: 8, sm: 12 } }}>
        <SectionHeadline overline={content.overline} title={content.Headline} />
        <Grid container columns={{ xs: 1, sm: 3 }} spacing={4}>
          {content.cards.map(({ title, imageUrl, description, action }) => (
            <Grid key={title} xs={3} sm={1}>
              <Box key={title}>
                <Box
                  sx={[
                    (theme) => ({
                      display: 'block',
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'center',
                      objectFit: 'contain',
                      background: `${
                        (theme.vars || theme).palette.primaryDark[800]
                      } url(${imageUrl})`,
                      backgroundSize: 'cover',
                      borderRadius: '8px',
                      paddingTop: '55%',
                      overflow: 'auto',
                      boxShadow: `0 0 8px 2px ${
                        (theme.vars || theme).palette.primary[100]
                      }, 0 4px 40px ${(theme.vars || theme).palette.primary[100]}`,
                      ...theme.applyDarkStyles({
                        boxShadow: `0 0 8px 2px ${
                          (theme.vars || theme).palette.primaryDark[600]
                        }, 0 4px 40px ${(theme.vars || theme).palette.primaryDark[500]}`,
                      }),
                    }),
                  ]}
                />
                <Box
                  mt={2}
                  sx={{
                    display: 'flex',
                    height: 250,
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    rowGap: 1,
                  }}
                >
                  <Typography component="h3" fontWeight="medium" color="text.primary">
                    {title}
                  </Typography>
                  <Typography variant="body" color="text.secondary">
                    {description}
                  </Typography>
                  {action ? (
                    <Link href={action.href}>
                      {action.label}
                      <KeyboardArrowRightRounded />
                    </Link>
                  ) : null}
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}

CardGrid.propTypes = {
  content: PropTypes.shape({
    cards: PropTypes.arrayOf(
      PropTypes.shape({
        description: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
        imageUrl: PropTypes.string,
        title: PropTypes.string.isRequired,
      }),
    ),
    Headline: PropTypes.node.isRequired,
    overline: PropTypes.string.isRequired,
  }).isRequired,
};
