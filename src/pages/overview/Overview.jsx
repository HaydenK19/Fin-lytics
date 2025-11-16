import React, { useEffect, useState } from 'react';
import { Grid, CircularProgress, Typography, Box, Alert } from '@mui/material';
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

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:8000/overview', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOverviewData(res.data);
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
    <Grid container spacing={2} sx={{ p: 2 }}>
      {/* Left column */}
      <Grid item xs={12} md={8}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Summary summary={overviewData.summary} />
          <Holdings />
        </Box>
      </Grid>

      {/* Right column */}
      <Grid item xs={12} md={4}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TopMovers movers={overviewData.top_movers} />
          <MarketOverview market={overviewData.market_overview} />
          <News news={overviewData.news_feed} />
        </Box>
      </Grid>
    </Grid>
  );
}
