import React, { useEffect, useState } from 'react';
import { Grid, CircularProgress, Typography, Box, Alert, FormControl, InputLabel, Select, MenuItem, Button, Menu } from '@mui/material';
import Summary from './components/Summary';
import Holdings from './components/Holdings';
import TopMovers from './components/TopMovers';
import MarketOverview from './components/MarketOverview';
import News from './components/News';
import axios from 'axios';
import PortfolioManager from './components/PortfolioManager';

export default function Overview() {
  const [overviewData, setOverviewData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [portfolios, setPortfolios] = useState([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState(null);
  const [menuAnchor, setMenuAnchor] = useState(null);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:8000/overview', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOverviewData(res.data);
        // attempt to fetch portfolios if available
        try {
          const p = await axios.get('http://localhost:8000/investments/portfolios', {
            headers: { Authorization: `Bearer ${token}` },
          });
          setPortfolios(p.data.portfolios || []);
          if ((p.data.portfolios || []).length > 0) setSelectedPortfolio((p.data.portfolios || [])[0].id || null);
        } catch (pfErr) {
          // ignore if endpoint not available
          console.debug('No portfolios endpoint or failed to fetch portfolios', pfErr?.message || pfErr);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchOverview();
  }, []);

  if (loading)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );

  if (error)
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Error: {error}
      </Alert>
    );

  return (
    <Box
      className="app-page"
      sx={{
        width: '100%',
        minHeight: '100vh',
        p: { xs: 1, sm: 3, md: 5 },
        boxSizing: 'border-box',
        overflowX: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: 1400,
          background: 'rgba(255,255,255,0.95)',
          borderRadius: 4,
          boxShadow: '0 4px 32px 0 rgba(60,72,100,0.10)',
          p: { xs: 2, sm: 4 },
          mb: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, width: '100%' }}>
          <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: 1, color: '#2d3a4a' }}>Overview</Typography>
          <PortfolioManager />
        </Box>
        <Grid container spacing={2} sx={{ width: '100%', flexWrap: 'wrap' }}>
          <Grid item xs={12} md={10} sx={{ flexGrow: 1, minWidth: 0, width: { xs: '100%', md: '0' } }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%' }}>
              <Summary summary={overviewData.summary} />
              <Holdings portfolioId={selectedPortfolio} />
            </Box>
          </Grid>
          <Grid item xs={12} md={2} sx={{ flexGrow: 1, minWidth: 0, width: { xs: '100%', md: '0' }, maxWidth: 340 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%' }}>
              <TopMovers movers={overviewData.top_movers} />
              <MarketOverview market={overviewData.market_overview} />
            </Box>
          </Grid>
        </Grid>
        <Box sx={{ mt: 4 }}>
          <News news={overviewData.news_feed} />
        </Box>
      </Box>
    </Box>
  );
}
