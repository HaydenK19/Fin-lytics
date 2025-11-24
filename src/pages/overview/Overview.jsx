import React, { useEffect, useState } from 'react';
import { Grid, CircularProgress, Typography, Box, Alert, FormControl, InputLabel, Select, MenuItem, Button, Menu } from '@mui/material';
import Summary from './components/Summary';
import Holdings from './components/Holdings';
import TopMovers from './components/TopMovers';
import MarketOverview from './components/MarketOverview';
import News from './components/News';
import axios from 'axios';

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
    <Box className="app-page">
      <Grid container spacing={2} sx={{ width: '100%', m: 0, p: 0 }}>
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>Overview</Typography>
            {portfolios.length > 0 && (
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Portfolio</InputLabel>
                <Select
                  value={selectedPortfolio || ''}
                  label="Portfolio"
                  onChange={(e) => setSelectedPortfolio(e.target.value)}
                >
                  {portfolios.map(p => (
                    <MenuItem key={p.id} value={p.id}>{p.name || p.id}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            <Button size="small" variant="outlined" onClick={(e) => setMenuAnchor(e.currentTarget)}>Manage Portfolios</Button>
          </Box>
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ width: '100%', m: 0, p: 0 }}>
        <Grid item xs={12} md={8}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Summary summary={overviewData.summary} />
            <Holdings portfolioId={selectedPortfolio} />
          </Box>
        </Grid>

        <Grid item xs={12} md={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TopMovers movers={overviewData.top_movers} />
            <MarketOverview market={overviewData.market_overview} />
          </Box>
        </Grid>
      </Grid>
      
      <Box sx={{ p: 2 }}>
        <News news={overviewData.news_feed} />
      </Box>
    </Box>
  );
}
