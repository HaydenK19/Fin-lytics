import React from 'react';
import { Paper, Box, Typography, Divider, List, ListItem, ListItemText } from '@mui/material';

export default function TopMovers({ movers }) {
  if (!movers || movers.length === 0) {
    return (
      <Paper elevation={2} sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary">No movers available.</Typography>
      </Paper>
    );
  }

  const topTwo = movers.slice(0, 2);

  return (
    <Paper elevation={2} sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>Top Movers (Portfolio)</Typography>
      <Divider sx={{ mb: 1 }} />

      <List>
        {topTwo.map((m, idx) => (
          <ListItem key={idx} disableGutters secondaryAction={
            <Box textAlign="right">
              <Typography color="success.main" fontWeight="bold">
                +${m.change_value.toFixed(2)}
              </Typography>
              <Typography color="success.dark" variant="body2">
                +{m.change_percent}%
              </Typography>
            </Box>
          }>
            <ListItemText
              primary={<Typography fontWeight="500">{m.symbol}</Typography>}
              secondary={<Typography variant="body2" color="text.secondary">{m.name}</Typography>}
            />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
}
