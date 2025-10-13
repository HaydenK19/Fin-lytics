import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    List,
    ListItem,
    ListItemText,
    TextField,
    IconButton,
    Box,
    Card,
    CardContent,
    Stack,
    Chip,
    Alert,
} from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import SavingsIcon from '@mui/icons-material/Savings';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import InfoIcon from '@mui/icons-material/Info';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPencil, faCheck } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";

const EditAccounts = ({ onClose }) => {
    const [balances, setBalances] = useState({
        checking: 0,
        savings: 0,
        debit: 0,
        credit: 0,
        cash: 0,
    });
    const [cashInput, setCashInput] = useState(0);
    const [isEditingCash, setIsEditingCash] = useState(false);

    const fetchBalances = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get("http://localhost:8000/user_balances/", {
                headers: { Authorization: `Bearer ${token}` },
                withCredentials: true,
            });

            const { plaid_balances, cash_balance } = response.data;

            const debit = plaid_balances
                .filter(account => account.type === "depository")
                .reduce((sum, account) => sum + (account.balance || 0), 0);

            const savings = plaid_balances
                .filter(account => account.subtype === "savings")
                .reduce((sum, account) => sum + (account.balance || 0), 0);

            const checking = plaid_balances
                .filter(account => account.subtype === "checking")
                .reduce((sum, account) => sum + (account.balance || 0), 0);

            const credit = plaid_balances
                .filter(account => account.type === "credit")
                .reduce((sum, account) => sum + (account.balance || 0), 0);

            setBalances({ debit, credit, cash: cash_balance, savings, checking });
            setCashInput(cash_balance);
        } catch (error) {
            console.error("Error fetching user balances:", error.response ? error.response.data : error);
        }
    };

    useEffect(() => {
        fetchBalances();
    }, []);

    const handleCashUpdate = async () => {
        try {
            const token = localStorage.getItem("token");
            await axios.post(
                "http://localhost:8000/user_balances/update_cash_balance/",
                { cash_balance: cashInput },
                {
                    headers: { Authorization: `Bearer ${token}` },
                    withCredentials: true,
                }
            );

            await fetchBalances();
            setIsEditingCash(false);
        } catch (error) {
            console.error("Error updating cash balance:", error.response ? error.response.data : error);
        }
    };

    return (
                <Dialog open onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle sx={{ position: 'relative', pb: 1 }}>
                Account Balances
                <IconButton
                    aria-label="close"
                    onClick={onClose}
                    sx={{
                        position: 'absolute',
                        right: 8,
                        top: 8,
                        color: (theme) => theme.palette.grey[500],
                    }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
                        <DialogContent>
                <Alert severity="info" sx={{ mb: 2 }}>
                    Your bank account balances are automatically synced through Plaid. Only cash balances can be manually edited.
                </Alert>

                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AccountBalanceIcon color="primary" />
                    Account Overview
                </Typography>

                <Stack spacing={2}>
                    {/* Bank Accounts - Read Only */}
                    <Card variant="outlined" sx={{ backgroundColor: '#f8f9fa' }}>
                        <CardContent sx={{ py: 2 }}>
                            <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 1 }}>
                                <AccountBalanceIcon fontSize="small" />
                                Bank Accounts (Auto-Synced)
                            </Typography>
                            <Stack spacing={1}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <AccountBalanceIcon fontSize="small" color="primary" />
                                        <Typography variant="body2">Checking Account</Typography>
                                    </Box>
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                        ${balances.checking?.toFixed(2) || "0.00"}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <SavingsIcon fontSize="small" color="success" />
                                        <Typography variant="body2">Savings Account</Typography>
                                    </Box>
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                        ${balances.savings?.toFixed(2) || "0.00"}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <CreditCardIcon fontSize="small" color="warning" />
                                        <Typography variant="body2">Credit Cards</Typography>
                                    </Box>
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                        ${balances.credit?.toFixed(2) || "0.00"}
                                    </Typography>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>

                    {/* Cash - Editable */}
                    <Card variant="outlined" sx={{ borderColor: '#2563eb', backgroundColor: '#fefefe' }}>
                        <CardContent sx={{ py: 2 }}>
                            <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, color: '#2563eb', display: 'flex', alignItems: 'center', gap: 1 }}>
                                <AccountBalanceWalletIcon fontSize="small" />
                                Manual Entry
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <AttachMoneyIcon fontSize="small" sx={{ color: '#2563eb' }} />
                                    <Typography variant="body2">Cash on Hand</Typography>
                                    <Chip label="Editable" size="small" color="primary" variant="outlined" />
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    {isEditingCash ? (
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <TextField
                                                type="number"
                                                value={cashInput}
                                                onChange={(e) => setCashInput(parseFloat(e.target.value) || 0)}
                                                size="small"
                                                sx={{ width: 120 }}
                                                placeholder="0.00"
                                                inputProps={{ step: '0.01', min: '0' }}
                                            />
                                            <IconButton
                                                onClick={handleCashUpdate}
                                                size="small"
                                                sx={{ color: 'success.main' }}
                                            >
                                                <CheckIcon />
                                            </IconButton>
                                        </Stack>
                                    ) : (
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <Typography variant="body2" sx={{ fontWeight: 500, minWidth: 60 }}>
                                                ${balances.cash?.toFixed(2) || "0.00"}
                                            </Typography>
                                            <IconButton
                                                onClick={() => {
                                                    setIsEditingCash(true);
                                                    setCashInput(balances.cash || 0);
                                                }}
                                                size="small"
                                                sx={{ color: '#2563eb' }}
                                            >
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                        </Stack>
                                    )}
                                </Box>
                            </Box>
                            {isEditingCash && (
                                <Typography variant="caption" sx={{ color: 'text.secondary', mt: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <InfoIcon fontSize="inherit" />
                                    Enter the amount of cash you currently have on hand (wallet, home, etc.)
                                </Typography>
                            )}
                        </CardContent>
                    </Card>

                    {/* Total Summary */}
                    <Card variant="outlined" sx={{ backgroundColor: '#e8f5e8', borderColor: 'success.main' }}>
                        <CardContent sx={{ py: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'success.dark', display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <TrendingUpIcon />
                                    Total Assets
                                </Typography>
                                <Typography variant="h6" sx={{ fontWeight: 700, color: 'success.dark' }}>
                                    ${((balances.checking || 0) + (balances.savings || 0) + (balances.cash || 0)).toFixed(2)}
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button 
                    onClick={onClose}
                    sx={{ 
                        color: '#666',
                        '&:hover': {
                            backgroundColor: 'rgba(102, 102, 102, 0.1)'
                        }
                    }}
                >
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default EditAccounts;