import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Paper,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
} from '@mui/material';

export default function Holdings() {
  const [holdings, setHoldings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHoldings = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:8000/investments/holdings', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setHoldings(res.data.holdings || []);
      } catch (err) {
        console.error(err);
        setError('Failed to fetch holdings');
      } finally {
        setLoading(false);
      }
    };
    fetchHoldings();
  }, []);

  if (loading)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );

  if (error)
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );

  if (!holdings.length)
    return (
      <Alert severity="info" sx={{ m: 2 }}>
        No holdings available yet.
      </Alert>
    );

  return (
    <Paper elevation={3} sx={{ p: 2, borderRadius: 2 }}>
      <Typography variant="h6" gutterBottom>
        Portfolio Holdings
      </Typography>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell><strong>Ticker</strong></TableCell>
              <TableCell><strong>Shares</strong></TableCell>
              <TableCell><strong>Price</strong></TableCell>
              <TableCell><strong>Market Value</strong></TableCell>
              <TableCell><strong>Daily Change ($)</strong></TableCell>
              <TableCell><strong>Daily Change (%)</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {holdings.map((h, idx) => (
              <TableRow key={idx}>
                <TableCell>{h.symbol || '-'}</TableCell>
                <TableCell>{h.quantity?.toLocaleString() || 0}</TableCell>
                <TableCell>${(h.price || 0).toFixed(2)}</TableCell>
                <TableCell>${(h.value || 0).toLocaleString()}</TableCell>
                <TableCell
                  sx={{
                    color:
                      h.daily_change > 0
                        ? 'success.main'
                        : h.daily_change < 0
                        ? 'error.main'
                        : 'text.primary',
                  }}
                >
                  {h.daily_change >= 0 ? '+' : ''}
                  ${h.daily_change?.toFixed(2) || '0.00'}
                </TableCell>
                <TableCell
                  sx={{
                    color:
                      h.daily_change_percent > 0
                        ? 'success.main'
                        : h.daily_change_percent < 0
                        ? 'error.main'
                        : 'text.primary',
                  }}
                >
                  {h.daily_change_percent >= 0 ? '+' : ''}
                  {h.daily_change_percent?.toFixed(2) || '0.00'}%
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
