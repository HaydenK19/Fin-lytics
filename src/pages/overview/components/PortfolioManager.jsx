import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';



const initialPortfolios = [
  {
    id: 1,
    name: 'Growth Portfolio',
    description: 'Tech and growth stocks',
    holdings: [
      { id: 1, ticker: 'AAPL', shares: 10, price: 190.12 },
      { id: 2, ticker: 'MSFT', shares: 5, price: 370.55 },
      { id: 3, ticker: 'NVDA', shares: 2, price: 480.10 },
    ],
  },
  {
    id: 2,
    name: 'Dividend Portfolio',
    description: 'Stable dividend payers',
    holdings: [
      { id: 1, ticker: 'KO', shares: 20, price: 58.12 },
      { id: 2, ticker: 'PG', shares: 8, price: 150.33 },
    ],
  },
];




const PortfolioManager = () => {
  const [open, setOpen] = useState(false);
  const [portfolios, setPortfolios] = useState(initialPortfolios);
  const [selected, setSelected] = useState(initialPortfolios[0].id);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ ticker: '', shares: '', price: '' });

  const selectedPortfolio = portfolios.find(p => p.id === selected);

  // Add holding
  const handleAdd = (e) => {
    e.preventDefault();
    if (!form.ticker || !form.shares || !form.price) return;
    setPortfolios(ps => ps.map(p =>
      p.id === selected
        ? { ...p, holdings: [...p.holdings, { id: Date.now(), ...form, shares: parseFloat(form.shares), price: parseFloat(form.price) }] }
        : p
    ));
    setForm({ ticker: '', shares: '', price: '' });
  };

  // Remove holding
  const handleRemove = (id) => {
    setPortfolios(ps => ps.map(p =>
      p.id === selected
        ? { ...p, holdings: p.holdings.filter(h => h.id !== id) }
        : p
    ));
    setEditId(null);
  };

  // Edit holding
  const handleEdit = (h) => {
    setEditId(h.id);
    setForm({ ticker: h.ticker, shares: h.shares, price: h.price });
  };

  // Save edit
  const handleSave = (e) => {
    e.preventDefault();
    setPortfolios(ps => ps.map(p =>
      p.id === selected
        ? { ...p, holdings: p.holdings.map(h => h.id === editId ? { ...h, ...form, shares: parseFloat(form.shares), price: parseFloat(form.price) } : h) }
        : p
    ));
    setEditId(null);
    setForm({ ticker: '', shares: '', price: '' });
  };

  return (
    <>
      <Button
        variant="contained"
        sx={{
          bgcolor: '#749181',
          color: '#fff',
          fontWeight: 700,
          fontSize: 17,
          borderRadius: 2,
          boxShadow: '0 2px 8px 0 rgba(116,145,129,0.10)',
          px: 3,
          py: 1.2
        }}
        onClick={() => setOpen(true)}
      >
        Manage Portfolios
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ bgcolor: '#f5f7fa', color: '#749181', fontWeight: 800, letterSpacing: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Portfolio Manager
          <IconButton onClick={() => setOpen(false)} size="large" sx={{ color: '#7b8794' }}>
            <CloseIcon fontSize="inherit" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ bgcolor: '#f5f7fa', pb: 2 }}>
          <Tabs
            value={portfolios.findIndex(p => p.id === selected)}
            onChange={(_, idx) => { setSelected(portfolios[idx].id); setEditId(null); setForm({ ticker: '', shares: '', price: '' }); }}
            sx={{ mb: 2 }}
            textColor="primary"
            indicatorColor="primary"
          >
            {portfolios.map((p) => (
              <Tab key={p.id} label={p.name} sx={{ fontWeight: 700, color: selected === p.id ? '#749181' : '#222b45' }} />
            ))}
          </Tabs>
          <Box sx={{ bgcolor: '#fff', borderRadius: 2, p: 2.5, mb: 2, border: '1px solid #e0e6ed' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#749181' }}>{selectedPortfolio.name}</Typography>
            <Typography sx={{ color: '#7b8794', fontSize: 15, mb: 1 }}>{selectedPortfolio.description}</Typography>
            <Typography sx={{ fontWeight: 600, color: '#749181', fontSize: 16, mb: 1 }}>
              Total Value: ${selectedPortfolio.holdings.reduce((sum, h) => sum + h.shares * h.price, 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </Typography>
            <Typography sx={{ fontWeight: 600, color: '#222b45', mb: 0.5 }}>Holdings:</Typography>
            <TableContainer component={Paper} sx={{ boxShadow: 'none', bgcolor: 'transparent' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, color: '#7b8794', fontSize: 14 }}>Ticker</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: '#7b8794', fontSize: 14 }}>Shares</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: '#7b8794', fontSize: 14 }}>Price</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: '#7b8794', fontSize: 14 }}>Value</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, color: '#7b8794', fontSize: 14 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedPortfolio.holdings.map(h => (
                    <TableRow key={h.id} sx={{ borderBottom: '1px solid #e0e6ed' }}>
                      {editId === h.id ? (
                        <>
                          <TableCell><TextField value={form.ticker} onChange={e => setForm(f => ({ ...f, ticker: e.target.value }))} size="small" sx={{ width: 90 }} /></TableCell>
                          <TableCell align="right"><TextField type="number" value={form.shares} onChange={e => setForm(f => ({ ...f, shares: e.target.value }))} size="small" sx={{ width: 90 }} /></TableCell>
                          <TableCell align="right"><TextField type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} size="small" sx={{ width: 100 }} /></TableCell>
                          <TableCell align="right">-</TableCell>
                          <TableCell align="center">
                            <Button onClick={handleSave} variant="contained" sx={{ bgcolor: '#749181', color: '#fff', borderRadius: 1, fontWeight: 600, mr: 1 }} size="small">Save</Button>
                            <Button onClick={() => { setEditId(null); setForm({ ticker: '', shares: '', price: '' }); }} variant="outlined" sx={{ color: '#222b45', borderColor: '#eee', borderRadius: 1, fontWeight: 600 }} size="small">Cancel</Button>
                          </TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell sx={{ fontWeight: 600 }}>{h.ticker}</TableCell>
                          <TableCell align="right">{h.shares}</TableCell>
                          <TableCell align="right">${h.price.toFixed(2)}</TableCell>
                          <TableCell align="right">${(h.shares * h.price).toLocaleString(undefined, { maximumFractionDigits: 2 })}</TableCell>
                          <TableCell align="center">
                            <IconButton onClick={() => handleEdit(h)} sx={{ color: '#222b45' }}><EditIcon /></IconButton>
                            <IconButton onClick={() => handleRemove(h.id)} sx={{ color: '#c0392b' }}><DeleteIcon /></IconButton>
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Box component="form" onSubmit={handleAdd} sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 2 }}>
              <TextField value={form.ticker} onChange={e => setForm(f => ({ ...f, ticker: e.target.value }))} placeholder="Ticker" size="small" sx={{ width: 90 }} />
              <TextField type="number" value={form.shares} onChange={e => setForm(f => ({ ...f, shares: e.target.value }))} placeholder="Shares" size="small" sx={{ width: 90 }} />
              <TextField type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="Price" size="small" sx={{ width: 100 }} />
              <Button type="submit" variant="contained" sx={{ bgcolor: '#749181', color: '#fff', borderRadius: 1, fontWeight: 700, fontSize: 15 }} size="small">Add</Button>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ bgcolor: '#f5f7fa' }}>
          <Button onClick={() => setOpen(false)} variant="contained" sx={{ bgcolor: '#749181', color: '#fff', borderRadius: 2, fontWeight: 700, fontSize: 15, mt: 1 }}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PortfolioManager;
