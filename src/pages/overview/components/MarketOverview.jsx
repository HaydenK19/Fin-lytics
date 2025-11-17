import React from 'react';
import { Paper, Box, Typography, Divider, List, ListItem, ListItemText } from '@mui/material';

export default function MarketOverview({ market }) {
  if (!market || !market.gainers || market.gainers.length === 0) {
    return (
      <Paper elevation={2} sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary">No market data available.</Typography>
      </Paper>
    );
  }

  const indices = market.indices || [];
  const gainers = market.gainers.slice(0, 3);

  return (
    <Paper elevation={2} sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>Market Overview</Typography>
      <Divider sx={{ mb: 2 }} />

      {/* Indices Section */}
      <Box sx={{ mb: 2 }}>
        {indices.map((i, idx) => (
          <Typography key={idx} variant="body2" sx={{ mb: 0.5 }}>
            {i.index}: {i.price.toLocaleString()} {' '}
            <Typography component="span" color="success.main">+{i.change_percent}%</Typography>
          </Typography>
        ))}
      </Box>

      {/* Top Gainers Section */}
      <Typography variant="subtitle2" color="text.secondary">Top Gainers</Typography>
      <List dense>
        {gainers.map((g, idx) => (
          <ListItem key={idx} disableGutters>
            <ListItemText
              primary={<Typography variant="body2">{g.symbol}</Typography>}
              secondary={<Typography color="success.main">+{g.change_percent}%</Typography>}
            />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
}
