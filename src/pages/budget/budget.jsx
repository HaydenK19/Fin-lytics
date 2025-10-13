import React, { useEffect, useState } from "react";
import { Box, Grid, Paper, Typography, Button, IconButton, Tooltip, Stack, List, ListItem, ListItemText, Divider, TextField } from "@mui/material";
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import "../../styles/pages/dashboard/budget-page/budget.scss";
import axios from "axios";
import VisualCard from "./cards/visual-data.jsx";
import ProjectionsCard from "./cards/projections.jsx";
import FinancialCalendar from "../budget/WeeklyOverview.jsx";
import TransactionCard from "./cards/transactions.jsx";
import EditTransactions from "./popups/edit-transactions.jsx";
import ManageBudgets from "./popups/man-budget.jsx";
import EditAccounts from "./popups/edit-acc.jsx";
import { useNavigate } from "react-router-dom";


const QuickAccess = ({ onEditTransactions, onManageBudgets, onEditAccounts }) => {
  return (
    <div className="header-quick-access">
      <Tooltip title="Edit Transactions">
        <IconButton onClick={onEditTransactions} size="small" aria-label="edit-transactions">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" fill="currentColor"/><path d="M20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z" fill="currentColor"/></svg>
        </IconButton>
      </Tooltip>
      <Tooltip title="Manage Budgets">
        <IconButton onClick={onManageBudgets} size="small" aria-label="manage-budgets">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 3L2 9l10 6 10-6-10-6zm0 8.5L4.21 9 12 5.5 19.79 9 12 11.5zM2 17l10 6 10-6v-2l-10 6-10-6v2z" fill="currentColor"/></svg>
        </IconButton>
      </Tooltip>
      <Tooltip title="Edit Accounts">
        <IconButton onClick={onEditAccounts} size="small" aria-label="edit-accounts">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 12c2.7 0 5-2.3 5-5s-2.3-5-5-5-5 2.3-5 5 2.3 5 5 5zm0 2c-3.3 0-10 1.7-10 5v3h20v-3c0-3.3-6.7-5-10-5z" fill="currentColor"/></svg>
        </IconButton>
      </Tooltip>
    </div>
  );
}

// MyAccounts component (MUI-based) — preserves existing fetch/save logic
const MyAccounts = () => {
  const [balances, setBalances] = useState({
    checking: { balance_amount: 0, previous_balance: 0 },
    savings: { balance_amount: 0, previous_balance: 0 },
    cash: { balance_amount: 0, previous_balance: 0 }
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editedBalances, setEditedBalances] = useState({ checking: '', savings: '', cash: '' });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBalances = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("http://localhost:8000/balances/", {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });

        const balancesObj = response.data.reduce((acc, balance) => {
          acc[balance.balance_name] = {
            balance_amount: balance.balance_amount,
            previous_balance: balance.previous_balance
          };
          return acc;
        }, {});

        setBalances(balancesObj);
        setEditedBalances({
          checking: balancesObj.checking?.balance_amount?.toString() || '0',
          savings: balancesObj.savings?.balance_amount?.toString() || '0',
          cash: balancesObj.cash?.balance_amount?.toString() || '0'
        });
      } catch (error) {
        if (error.response && error.response.status === 401) {
          console.error("Unauthorized: Redirecting to login.");
          alert("Your session has expired. Please log in again.");
          localStorage.removeItem("token");
          navigate("/login");
        } else {
          console.error("Error fetching balances:", error);
        }
      }
    };

    fetchBalances();
  }, [navigate]);

  const handleEditClick = () => {
    setIsEditing(true);
    setEditedBalances({
      checking: balances.checking?.balance_amount?.toString() || '0',
      savings: balances.savings?.balance_amount?.toString() || '0',
      cash: balances.cash?.balance_amount?.toString() || '0'
    });
  };

  const handleSaveBalances = async () => {
    try {
      const token = localStorage.getItem("token");
      const updates = Object.entries(editedBalances).map(([accountType, amount]) => ({
        balance_name: accountType,
        new_amount: parseFloat(amount)
      }));

      for (const update of updates) {
        await axios.put(
          "http://localhost:8000/balances/update",
          update,
          {
            headers: { Authorization: `Bearer ${token}` },
            withCredentials: true,
          }
        );
      }

      const newBalances = { ...balances };
      for (const update of updates) {
        if (newBalances[update.balance_name]) {
          newBalances[update.balance_name].balance_amount = update.new_amount;
        }
      }
      setBalances(newBalances);
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating balances:", error);
    }
  };

  const handleCancelEdit = () => setIsEditing(false);

  return (
    <Box className="card-content">
      <Box className="card-body">
        <List dense>
          {Object.entries(balances).map(([accountType, data]) => (
            <React.Fragment key={accountType}>
              <ListItem>
                <ListItemText
                  primary={accountType.charAt(0).toUpperCase() + accountType.slice(1)}
                  secondary={isEditing ? null : `$${(data.balance_amount || 0).toFixed(2)}`}
                />
                {isEditing && (
                  <TextField
                    size="small"
                    type="number"
                    value={editedBalances[accountType]}
                    onChange={(e) => setEditedBalances(prev => ({ ...prev, [accountType]: e.target.value }))}
                    inputProps={{ step: '0.01' }}
                    sx={{ width: 120 }}
                  />
                )}
              </ListItem>
              <Divider />
            </React.Fragment>
          ))}
        </List>

        <Box sx={{ display: 'flex', gap: 1, mt: 1, justifyContent: 'flex-end' }}>
          {isEditing ? (
            <>
              <Button size="small" variant="contained" onClick={handleSaveBalances}>Save All</Button>
              <Button size="small" variant="outlined" onClick={handleCancelEdit}>Cancel</Button>
            </>
          ) : (
            <Button size="small" variant="contained" onClick={handleEditClick}>Edit Balances</Button>
          )}
        </Box>
      </Box>
    </Box>
  );
};

// Carousel component for My Accounts, Recent Transactions, Data Analytics
const CardCarousel = () => {
  const [activeCard, setActiveCard] = useState(0);
  
  const cards = [
    {
      title: "My Accounts",
      component: <MyAccounts />
    },
    {
      title: "Recent Transactions", 
      component: <TransactionCard />
    },
    {
      title: "Data Analytics",
      component: <VisualCard />
    }
  ];

  const nextCard = () => {
    setActiveCard((prev) => (prev + 1) % cards.length);
  };

  const prevCard = () => {
    setActiveCard((prev) => (prev - 1 + cards.length) % cards.length);
  };

  return (
    <Paper elevation={3} sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h6" sx={{ mb: 1 }}>{cards[activeCard].title}</Typography>
      
      <Box sx={{ mb: 1 }}>
        {cards[activeCard].component}
      </Box>
      
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, pt: 1, borderTop: 1, borderColor: 'divider' }}>
        <IconButton onClick={prevCard} size="small">
          <ArrowBackIosNewIcon fontSize="small" />
        </IconButton>
        
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {cards.map((_, index) => (
            <Box
              key={index}
              onClick={() => setActiveCard(index)}
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: index === activeCard ? 'primary.main' : 'grey.300',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
            />
          ))}
        </Box>
        
        <IconButton onClick={nextCard} size="small">
          <ArrowForwardIosIcon fontSize="small" />
        </IconButton>
      </Box>
    </Paper>
  );
};

const Budget = () => {
  const [isEditTransactionsOpen, setIsEditTransactionsOpen] = useState(false);
  const [isManageBudgetsOpen, setIsManageBudgetsOpen] = useState(false);
  const [isEditAccountsOpen, setIsEditAccountsOpen] = useState(false);

  // Simple test to see if the component renders at all
  console.log("Budget component is rendering");

  return (
    <Box sx={{ padding: "20px", width: '100%', maxWidth: '100vw', minHeight: '100vh', overflowX: 'hidden', overflowY: 'auto', boxSizing: 'border-box' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4" gutterBottom>Budget Manager</Typography>

        <Stack direction="row" spacing={1} alignItems="center">
          <QuickAccess
            onEditTransactions={() => setIsEditTransactionsOpen(true)}
            onManageBudgets={() => setIsManageBudgetsOpen(true)}
            onEditAccounts={() => setIsEditAccountsOpen(true)}
          />
        </Stack>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%', maxWidth: 'calc(100vw - 40px)', boxSizing: 'border-box' }}>
        {/* Financial Calendar - spans entire width, taller */}
        <Paper elevation={3} className="calendar-card" sx={{ p: 0, minHeight: 400 }}>
          <Box sx={{ px: 2, pt: 1, pb: 1 }}>
            <Typography variant="h6">Financial Calendar</Typography>
          </Box>
          <FinancialCalendar />
        </Paper>

        {/* 1x2 fixed-width layout: Carousel (1/3) | Budget Projections (2/3) */}
        <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>
          <Box sx={{ width: 'calc(33.333% - 16px)', flexShrink: 0 }}>
            <CardCarousel />
          </Box>

          <Box sx={{ width: 'calc(66.667% - 8px)', flexShrink: 0 }}>
            <Paper elevation={3} className="projections-card" sx={{ p: 2, width: '100%' }}>
              <Typography variant="h6" sx={{ mb: 1 }}>Budget Projections</Typography>
              <ProjectionsCard />
            </Paper>
          </Box>
        </Box>
      </Box>

      {isEditTransactionsOpen && (
        <EditTransactions onClose={() => setIsEditTransactionsOpen(false)} />
      )}
      {isManageBudgetsOpen && (
        <ManageBudgets onClose={() => setIsManageBudgetsOpen(false)} />
      )}
      {isEditAccountsOpen && (
        <EditAccounts onClose={() => setIsEditAccountsOpen(false)} />
      )}
    </Box>
  )
}

export default Budget;