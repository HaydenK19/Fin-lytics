import React, { useEffect, useState } from "react";
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Alert from '@mui/material/Alert';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CloseIcon from '@mui/icons-material/Close';
import axios from 'axios';
import theme from '../../../theme/theme'; // Import centralized theme

const timeframesInMonths = {
    "3 months": 3,
    "6 months": 6,
    "9 months": 9,
    "1 year": 12,
    "1.5 years": 18,
};

const intervalsPerMonth = {
    weekly: 4,
    biweekly: 2,
    monthly: 1,
};

const STORAGE_KEY = "projectionsDraft_v2";

// Helper function to format numbers with commas
const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(value || 0);
};

const ProjectionsCard = () => {
    const [tabIndex, setTabIndex] = useState(0);
    const [timeframe, setTimeframe] = useState("3 months");
    const [startDate, setStartDate] = useState(() => {
        const today = new Date();
        return new Date(today.getFullYear(), today.getMonth(), today.getDate());
    });
    const [endDate, setEndDate] = useState(null);
    const [savingsGoal, setSavingsGoal] = useState(0);
    const [frequency, setFrequency] = useState("weekly");
    const [isShowingResults, setIsShowingResults] = useState(false);
    const [monthlyExpenses, setMonthlyExpenses] = useState([]);
    
    // Budget goals integration
    const [budgetGoals, setBudgetGoals] = useState({
        annual: [],
        category: []
    });
    const [selectedCategoryGoals, setSelectedCategoryGoals] = useState([]);
    const [selectedAnnualGoal, setSelectedAnnualGoal] = useState(null);
    const [includeAnnualExpenses, setIncludeAnnualExpenses] = useState(false);
    const [loadingGoals, setLoadingGoals] = useState(false);
    const [recurringModalOpen, setRecurringModalOpen] = useState(false);
    
    //recurring transactions integration
    const [recurringTransactions, setRecurringTransactions] = useState([]);
    const [selectedRecurringTransactions, setSelectedRecurringTransactions] = useState([]);
    const [loadingTransactions, setLoadingTransactions] = useState(false);

    useEffect(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed) {
                    setTimeframe(parsed.timeframe || "3 months");
                    setStartDate(parsed.startDate ? new Date(parsed.startDate) : (() => {
                        const today = new Date();
                        return new Date(today.getFullYear(), today.getMonth(), today.getDate());
                    })());
                    setEndDate(parsed.endDate ? new Date(parsed.endDate) : null);
                    setSavingsGoal(parsed.savingsGoal || 0);
                    setFrequency(parsed.frequency || "weekly");
                    setMonthlyExpenses(parsed.monthlyExpenses || []);
                }
            }
        } catch (e) {
            // ignore
        }
    }, []);

    useEffect(() => {
        const draft = {
            timeframe,
            startDate: startDate ? startDate.toISOString() : null,
            endDate: endDate ? endDate.toISOString() : null,
            savingsGoal,
            frequency,
            monthlyExpenses,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    }, [timeframe, startDate, endDate, savingsGoal, frequency, monthlyExpenses]);

    //load budget goals and recurring transactions on component mount
    useEffect(() => {
        fetchBudgetGoals();
        fetchRecurringTransactions();
    }, []);

    const fetchBudgetGoals = async () => {
        try {
            setLoadingGoals(true);
            const token = localStorage.getItem('token');
            
            // Fetch both annual and category goals
            const [annualResponse, categoryResponse] = await Promise.all([
                axios.get('http://localhost:8000/budget-goals/?goal_type=annual', {
                    headers: { Authorization: `Bearer ${token}` },
                    withCredentials: true,
                }),
                axios.get('http://localhost:8000/budget-goals/?goal_type=category', {
                    headers: { Authorization: `Bearer ${token}` },
                    withCredentials: true,
                })
            ]);
            
            setBudgetGoals({
                annual: annualResponse.data,
                category: categoryResponse.data
            });
            
        } catch (error) {
            console.error('Error fetching budget goals:', error);
        } finally {
            setLoadingGoals(false);
        }
    };

    const fetchRecurringTransactions = async () => {
        try {
            setLoadingTransactions(true);
            const token = localStorage.getItem('token');
            
            const response = await axios.get('http://localhost:8000/user_transactions/', {
                headers: { Authorization: `Bearer ${token}` },
                withCredentials: true,
                params: { 
                    recurring_only: true 
                }
            });
            
            console.log('Recurring transactions API response:', response.data);

            const userTransactions = response.data.user_transactions || [];
            console.log('User transactions from API:', userTransactions);
            
            const recurringTxs = userTransactions.filter(tx => {
                console.log('Checking transaction:', tx, 'is_recurring:', tx.is_recurring, 'recurring_enabled:', tx.recurring_enabled, 'parent_transaction_id:', tx.parent_transaction_id);
                return tx.is_recurring && 
                       tx.recurring_enabled !== false && 
                       !tx.parent_transaction_id; // Only include transactions that are NOT child instances
            });
            
            console.log('Filtered recurring transactions (parents only):', recurringTxs);
            setRecurringTransactions(recurringTxs);
            
        } catch (error) {
            console.error('Error fetching recurring transactions:', error);
        } finally {
            setLoadingTransactions(false);
        }
    };

    const handleTimeframeChange = (e) => {
        const selected = e.target.value;
        setTimeframe(selected);
        if (selected !== "custom") {
            const monthsToAdd = timeframesInMonths[selected] || 0;
            const newEnd = new Date(startDate.getFullYear(), startDate.getMonth() + monthsToAdd, startDate.getDate());
            setEndDate(newEnd);
        }
    };

    const handleSavingsGoalChange = (e) => {
        const value = e.target.value;
        if (value === '' || /^\d*\.?\d*$/.test(value)) {
            setSavingsGoal(value === '' ? 0 : parseFloat(value) || 0);
        }
    };
    const handleFrequencyChange = (e) => setFrequency(e.target.value);

    const addMonthlyExpense = () => setMonthlyExpenses((s) => [...s, { id: Date.now(), desc: "", amount: 0 }]);
    const updateExpense = (id, field, value) =>
        setMonthlyExpenses((list) => list.map((it) => (it.id === id ? { ...it, [field]: field === "amount" ? parseFloat(value) || 0 : value } : it)));
    const removeExpense = (id) => setMonthlyExpenses((list) => list.filter((it) => it.id !== id));

        // per-interval expenses handlers


    const calculateMonthsBetween = (start, end) => {
        if (!start || !end) return 0;
        const s = new Date(start.getFullYear(), start.getMonth(), 1);
        const e = new Date(end.getFullYear(), end.getMonth(), 1);
        const months = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth()) + 1;
        return Math.max(0, months);
    };

    const computeTotals = () => {
        const months = timeframesInMonths[timeframe] || 0;

        const totalMonthlyExp = monthlyExpenses.reduce((acc, cur) => acc + (parseFloat(cur.amount) || 0), 0);
        const intervals = Math.max(months * (intervalsPerMonth[frequency] || 0), 0);
        
        let recurringExpenses = 0;
        selectedRecurringTransactions.forEach(txId => {
            const tx = recurringTransactions.find(t => t.id === txId);
            if (tx) {
                let txPerMonth = 0;
                switch (tx.frequency_type) {
                    case 'weekly':
                        txPerMonth = Math.abs(tx.amount) * 4; // ~4 weeks per month
                        break;
                    case 'monthly':
                        txPerMonth = Math.abs(tx.amount);
                        break;
                    case 'yearly':
                        txPerMonth = Math.abs(tx.amount) / 12;
                        break;
                    default:
                        txPerMonth = Math.abs(tx.amount); // default to monthly
                }
                recurringExpenses += txPerMonth * months;
            }
        });

        let categoryBudgetExpenses = 0;
        selectedCategoryGoals.forEach(goalId => {
            const goal = budgetGoals.category.find(g => g.id === goalId);
            if (goal) {
                categoryBudgetExpenses += goal.goal_amount * months; // Scale monthly goals to time period
            }
        });

        let annualExpenses = 0;
        if (selectedAnnualGoal && includeAnnualExpenses) {
            const annualGoal = budgetGoals.annual.find(g => g.id === selectedAnnualGoal);
            if (annualGoal) {
                // Prorate annual goal to the selected timeframe
                annualExpenses = (annualGoal.goal_amount / 12) * months;
            }
        }

        const totalExpensesOverPeriod = totalMonthlyExp * months + categoryBudgetExpenses + annualExpenses + recurringExpenses;
        const netToSave = savingsGoal - totalExpensesOverPeriod;
        const perInterval = intervals > 0 ? netToSave / intervals : 0;

        return { 
            months, 
            totalMonthlyExp, 
            totalExpensesOverPeriod, 
            intervals, 
            netToSave, 
            perInterval,
            categoryBudgetExpenses,
            annualExpenses,
            recurringExpenses
        };
    };

        const onCalculate = () => {
            const monthsToAdd = timeframesInMonths[timeframe] || 0;
            const newEnd = new Date(startDate.getFullYear(), startDate.getMonth() + monthsToAdd, startDate.getDate());
            setEndDate(newEnd);
        setIsShowingResults(true);
    };

    const handleTabChange = (e, newIndex) => {
        setTabIndex(newIndex);
        setIsShowingResults(false);
    };
    // preview helper: compute months/intervals without toggling results
    const preview = () => computeTotals();



    return (
        <Box className="projections-card" sx={{ 
            padding: 2, 
            overflow: 'hidden'
        }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="h6">Budget Projections</Typography>
                <Button
                    variant="outlined"
                    size="small"
                    onClick={() => window.dispatchEvent(new CustomEvent('openBudgetModal'))}
                    sx={{
                        borderColor: 'primary.main',
                        color: 'primary.main',
                        '&:hover': {
                            borderColor: 'primary.dark',
                            backgroundColor: 'primary.light'
                        }
                    }}
                >
                    Manage Budget Goals
                </Button>
            </Box>
            <Box className="card-header" sx={{ mb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Tabs value={tabIndex} onChange={handleTabChange} aria-label="projections tabs">
                    <Tab label="Basic" />
                    <Tab label="Advanced" />
                </Tabs>
            </Box>

            {tabIndex === 0 && (
                <Box>
                    {!isShowingResults && (
                        <Box sx={{ maxHeight: 520, overflow: 'auto', pr: 1 }}>
                            <Stack spacing={1.5} className="card-body" sx={{ }}>
                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="center">
                                    <FormControl sx={{ minWidth: 160}}>
                                        <InputLabel id="timeframe-label">Timeframe</InputLabel>
                                        <Select labelId="timeframe-label" id="timeframe" value={timeframe} label="Timeframe" onChange={handleTimeframeChange}>
                                            <MenuItem value="3 months">3 Months</MenuItem>
                                            <MenuItem value="6 months">6 Months</MenuItem>
                                            <MenuItem value="9 months">9 Months</MenuItem>
                                            <MenuItem value="1 year">1 Year</MenuItem>
                                            <MenuItem value="1.5 years">1.5 Years</MenuItem>
                                        </Select>
                                    </FormControl>

                                    <TextField 
                                        label="Savings Goal ($)" 
                                        value={savingsGoal || ''} 
                                        onChange={handleSavingsGoalChange} 
                                        inputProps={{ inputMode: 'decimal' }}
                                    />

                                    <FormControl sx={{ minWidth: 160 }}>
                                        <InputLabel id="frequency-label">Frequency</InputLabel>
                                        <Select labelId="frequency-label" id="frequency" value={frequency} label="Frequency" onChange={handleFrequencyChange}>
                                            <MenuItem value="weekly">Every Week</MenuItem>
                                            <MenuItem value="biweekly">Every Other Week</MenuItem>
                                            <MenuItem value="monthly">Once a Month</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Stack>

                                <Box>
                                    <Typography variant="caption" color="text.secondary">Preview: {preview().months} months — {preview().intervals} intervals ({intervalsPerMonth[frequency]} per month)</Typography>
                                    <Box sx={{ mt: 1 }}>
                                        <Button variant="contained" onClick={onCalculate}>Calculate</Button>
                                    </Box>
                                </Box>
                            </Stack>
                        </Box>
                    )}

                    {isShowingResults && (
                        <Box sx={{ mt: 2 }}>
                            <ProjectedResults
                                savingsGoal={savingsGoal}
                                timeframe={timeframe}
                                frequency={frequency}
                                startDate={startDate}
                                endDate={endDate}
                                monthlyExpenses={monthlyExpenses}
                                computeTotals={computeTotals}
                                setIsShowingResults={setIsShowingResults}
                            />
                        </Box>
                    )}
                </Box>
            )}

            {/* advanced tab */}
            {tabIndex === 1 && (
                <Box>
                    {!isShowingResults && (
                        <Box sx={{ maxHeight: 520, overflow: 'auto', pr: 1 }}>
                            <Stack spacing={1.5} className="card-body">
                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="center">
                                    <FormControl sx={{ minWidth: 160 }}>
                                        <InputLabel id="timeframe-label">Timeframe</InputLabel>
                                        <Select labelId="timeframe-label" id="timeframe" value={timeframe} label="Timeframe" onChange={handleTimeframeChange}>
                                            <MenuItem value="3 months">3 Months</MenuItem>
                                            <MenuItem value="6 months">6 Months</MenuItem>
                                            <MenuItem value="9 months">9 Months</MenuItem>
                                            <MenuItem value="1 year">1 Year</MenuItem>
                                            <MenuItem value="1.5 years">1.5 Years</MenuItem>
                                        </Select>
                                    </FormControl>

                                    {timeframe === "custom" && (
                                        <Grid container spacing={1} alignItems="center">
                                            <Grid item>
                                                <TextField
                                                    label="Start Date"
                                                    type="date"
                                                    value={startDate ? 
                                                        `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}` 
                                                        : ""}
                                                    onChange={(e) => {
                                                        const [year, month, day] = e.target.value.split('-');
                                                        setStartDate(new Date(year, month - 1, day));
                                                    }}
                                                    InputLabelProps={{ shrink: true }}
                                                    sx={{ width: 160 }}
                                                />
                                            </Grid>
                                            <Grid item>
                                                <TextField
                                                    label="End Date"
                                                    type="date"
                                                    value={endDate ? 
                                                        `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}` 
                                                        : ""}
                                                    onChange={(e) => {
                                                        const [year, month, day] = e.target.value.split('-');
                                                        setEndDate(new Date(year, month - 1, day));
                                                    }}
                                                    InputLabelProps={{ shrink: true }}
                                                    sx={{ width: 160 }}
                                                />
                                            </Grid>
                                        </Grid>
                                    )}

                                    <TextField 
                                        label="Savings Goal ($)" 
                                        value={savingsGoal || ''} 
                                        onChange={handleSavingsGoalChange} 
                                        inputProps={{ inputMode: 'decimal' }}
                                    />

                                    <FormControl sx={{ minWidth: 160 }}>
                                        <InputLabel id="frequency-label">Frequency</InputLabel>
                                        <Select labelId="frequency-label" id="frequency" value={frequency} label="Frequency" onChange={handleFrequencyChange}>
                                            <MenuItem value="weekly">Every Week</MenuItem>
                                            <MenuItem value="biweekly">Every Other Week</MenuItem>
                                            <MenuItem value="monthly">Once a Month</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Stack>

                                <Divider />

                                <Box>
                                    <Box sx={{ mb: 1 }}>
                                        <Typography variant="caption" color="text.secondary">Preview: {preview().months} months — {preview().intervals} intervals ({intervalsPerMonth[frequency]} per month).</Typography>
                                    </Box>
                                    <Stack spacing={1}>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                            Monthly Expenses
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Add theoretical monthly expenses for projection calculations.
                                        </Typography>
                                        
                                        {monthlyExpenses.map((exp) => (
                                            <Stack key={exp.id} direction="row" spacing={0.5} alignItems="center">
                                                <TextField 
                                                    placeholder="Description" 
                                                    value={exp.desc} 
                                                    onChange={(e) => updateExpense(exp.id, 'desc', e.target.value)} 
                                                    sx={{ flex: 1 }} 
                                                    size="small" 
                                                />
                                                <TextField 
                                                    label="Amount ($)" 
                                                    value={exp.amount} 
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                                            updateExpense(exp.id, 'amount', value);
                                                        }
                                                    }}
                                                    sx={{ width: 140 }} 
                                                    size="small" 
                                                    inputProps={{ inputMode: 'decimal' }}
                                                />
                                                <IconButton color="error" onClick={() => removeExpense(exp.id)}>
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Stack>
                                        ))}

                                        <Button startIcon={<AddIcon />} onClick={addMonthlyExpense} variant="outlined" sx={{ alignSelf: 'flex-start' }}>
                                            Add Monthly Expense
                                        </Button>
                                    </Stack>

                                    <Divider sx={{ my: 2 }} />

                                    <Stack spacing={2}>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                            Import Budget Goals
                                        </Typography>
                                        
                                        {loadingGoals ? (
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <CircularProgress size={16} />
                                                <Typography variant="caption">Loading budget goals...</Typography>
                                            </Box>
                                        ) : (
                                            <>
                                                {budgetGoals.category.length > 0 && (
                                                    <Box>
                                                        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                                                            Select categories to include in your projections. Amounts will be scaled to your timeframe.
                                                        </Typography>
                                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                                            {budgetGoals.annual.map((goal) => (
                                                                <Chip
                                                                    key={goal.id}
                                                                    label={`${goal.goal_name}: ${formatCurrency(goal.goal_amount)}/year`}
                                                                    variant={selectedAnnualGoal === goal.id && includeAnnualExpenses ? "filled" : "outlined"}
                                                                    color={selectedAnnualGoal === goal.id && includeAnnualExpenses ? "secondary" : "default"}
                                                                    onClick={() => {
                                                                        if (selectedAnnualGoal === goal.id && includeAnnualExpenses) {
                                                                            setSelectedAnnualGoal(null);
                                                                            setIncludeAnnualExpenses(false);
                                                                        } else {
                                                                            setSelectedAnnualGoal(goal.id);
                                                                            setIncludeAnnualExpenses(true);
                                                                        }
                                                                    }}
                                                                    size="small"
                                                                />
                                                            ))}
                                                            {budgetGoals.category.map((goal) => (
                                                                <Chip
                                                                    key={goal.id}
                                                                    label={`${goal.category_name}: ${formatCurrency(goal.goal_amount)}/month`}
                                                                    variant={selectedCategoryGoals.includes(goal.id) ? "filled" : "outlined"}
                                                                    color={selectedCategoryGoals.includes(goal.id) ? "primary" : "default"}
                                                                    onClick={() => {
                                                                        if (selectedCategoryGoals.includes(goal.id)) {
                                                                            setSelectedCategoryGoals(prev => prev.filter(id => id !== goal.id));
                                                                        } else {
                                                                            setSelectedCategoryGoals(prev => [...prev, goal.id]);
                                                                        }
                                                                    }}
                                                                    size="small"
                                                                />
                                                            ))}
                                                            
                                                        </Box>
                                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                                            
                                                        </Box>
                                                    </Box>
                                                )}
                                                {budgetGoals.category.length === 0 && budgetGoals.annual.length === 0 && (
                                                    <Alert severity="info">
                                                        No budget goals found. Create some in the Budget Goals modal to use this feature.
                                                    </Alert>
                                                )}
                                            </>
                                        )}
                                    </Stack>

                                    <Divider sx={{ my: 2 }} />

                                    {/* Recurring Transactions Integration */}
                                    <Stack spacing={2}>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                            Import Recurring Transactions
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Select from your existing recurring transactions to include in calculations
                                        </Typography>
                                        
                                        {loadingTransactions ? (
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <CircularProgress size={16} />
                                                <Typography variant="caption">Loading recurring transactions...</Typography>
                                            </Box>
                                        ) : (
                                            <>
                                                {recurringTransactions.length > 0 && (
                                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                                                        {recurringTransactions.map((tx) => (
                                                            <Chip
                                                                key={tx.id}
                                                                label={`${tx.merchant_name || tx.category}: ${formatCurrency(Math.abs(tx.amount))}/${tx.frequency_type}`}
                                                                variant={selectedRecurringTransactions.includes(tx.id) ? "filled" : "outlined"}
                                                                color={selectedRecurringTransactions.includes(tx.id) ? "success" : "default"}
                                                                onClick={() => {
                                                                    setSelectedRecurringTransactions(prev => 
                                                                        prev.includes(tx.id) 
                                                                            ? prev.filter(id => id !== tx.id)
                                                                            : [...prev, tx.id]
                                                                    );
                                                                }}
                                                                clickable
                                                                size="small"
                                                            />
                                                        ))}
                                                    </Box>
                                                )}

                                                {!loadingTransactions && recurringTransactions.length === 0 && (
                                                    <Alert severity="info">
                                                        No recurring transactions found. Create some using the button below to use this feature.
                                                    </Alert>
                                                )}
                                            </>
                                        )}
                                    </Stack>

                                    <Divider sx={{ my: 2 }} />

                                    <Stack spacing={1}>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                            Add Recurring Transaction
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Add a recurring transaction directly to your account for consistent tracking.
                                        </Typography>
                                        
                                        <Button 
                                            variant="outlined" 
                                            startIcon={<AddIcon />}
                                            onClick={() => setRecurringModalOpen(true)}
                                            sx={{ alignSelf: 'flex-start' }}
                                        >
                                            Add Recurring Transaction
                                        </Button>
                                    </Stack>

                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                                    <Button variant="contained" onClick={onCalculate} size="large">
                                        Calculate Projections
                                    </Button>
                                </Box>
                            </Stack>
                        </Box>
                    )}

                    {isShowingResults && (
                        <Box sx={{ mt: 2 }}>
                            <ProjectedResults
                                savingsGoal={savingsGoal}
                                timeframe={timeframe}
                                frequency={frequency}
                                startDate={startDate}
                                endDate={endDate}
                                monthlyExpenses={monthlyExpenses}
                                computeTotals={computeTotals}
                                setIsShowingResults={setIsShowingResults}
                            />
                        </Box>
                    )}
                </Box>
            )}

            <Dialog 
                open={recurringModalOpen} 
                onClose={() => setRecurringModalOpen(false)}
                maxWidth="sm"
            >
                <DialogTitle>
                    Add Recurring Transaction
                    <IconButton
                        aria-label="close"
                        onClick={() => setRecurringModalOpen(false)}
                        sx={{
                            position: 'absolute',
                            right: 8,
                            top: 8,
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <RecurringTransactionWidget onSuccess={() => {
                        fetchRecurringTransactions(); // Refresh the list
                        setRecurringModalOpen(false); // Close modal on success
                    }} />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setRecurringModalOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ProjectionsCard;

const ProjectedResults = ({ savingsGoal, timeframe, frequency, startDate, endDate, monthlyExpenses, computeTotals, setIsShowingResults }) => {
    const { months, totalMonthlyExp, totalExpensesOverPeriod, intervals, netToSave, perInterval, categoryBudgetExpenses, annualExpenses, recurringExpenses } = computeTotals();

    return (
        <Paper sx={{ p: 1.5 }}>
            <Typography variant="h6" sx={{ fontSize: '1.1rem' }}>Projected Savings</Typography>
            <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                <Typography sx={{ fontSize: '0.9rem' }}>
                    From <strong>{startDate.toLocaleDateString()}</strong> to <strong>{endDate ? endDate.toLocaleDateString() : 'N/A'}</strong> ({months} months)
                </Typography>

                <Typography sx={{ fontSize: '0.9rem' }}>Goal: <strong>{formatCurrency(savingsGoal)}</strong></Typography>
                <Typography sx={{ fontSize: '0.9rem' }}>Monthly expenses total: <strong>{formatCurrency(totalMonthlyExp)}</strong></Typography>
                <Typography sx={{ fontSize: '0.9rem', color: 'error.main' }}>
                    Total expenses over period: <strong>{formatCurrency(totalExpensesOverPeriod)}</strong>
                </Typography>
                <Typography sx={{ fontSize: '0.9rem' }}>Net to save (goal - expenses): <strong>{formatCurrency(netToSave)}</strong></Typography>
                <Typography sx={{ fontSize: '0.9rem' }}>Saving frequency: <strong>{frequency}</strong> — intervals: <strong>{intervals}</strong></Typography>
                <Typography sx={{ fontSize: '0.9rem' }}>You need to save <strong>{formatCurrency(perInterval)}</strong> per <strong>{frequency}</strong> to meet the net target.</Typography>

                {netToSave < 0 && (
                    <Typography color="error">Warning: projected expenses exceed goal by <strong>{formatCurrency(Math.abs(netToSave))}</strong>.</Typography>
                )}

                <Divider />

                <Typography variant="subtitle2">Expenses Breakdown</Typography>
                
                {monthlyExpenses.length > 0 && (
                    <>
                        <Typography variant="body2" sx={{ fontWeight: 500, mt: 1 }}>Manual Monthly Expenses:</Typography>
                        {monthlyExpenses.map((e) => (
                            <Stack direction="row" justifyContent="space-between" key={e.id}>
                                <Typography>{e.desc || 'Untitled'}</Typography>
                                <Typography>{formatCurrency(parseFloat(e.amount) || 0)} / month</Typography>
                            </Stack>
                        ))}
                    </>
                )}

                {categoryBudgetExpenses > 0 && (
                    <>
                        <Typography variant="body2" sx={{ fontWeight: 500, mt: 1 }}>Category Budget Expenses:</Typography>
                        <Stack direction="row" justifyContent="space-between">
                            <Typography>Selected category budgets (scaled to {months} months)</Typography>
                            <Typography>{formatCurrency(categoryBudgetExpenses)} total</Typography>
                        </Stack>
                    </>
                )}

                {recurringExpenses > 0 && (
                    <>
                        <Typography variant="body2" sx={{ fontWeight: 500, mt: 1 }}>Recurring Transaction Expenses:</Typography>
                        <Stack direction="row" justifyContent="space-between">
                            <Typography>Selected recurring transactions (scaled to {months} months)</Typography>
                            <Typography>{formatCurrency(recurringExpenses)} total</Typography>
                        </Stack>
                    </>
                )}

                {annualExpenses > 0 && (
                    <>
                        <Typography variant="body2" sx={{ fontWeight: 500, mt: 1 }}>Annual Goal Expenses:</Typography>
                        <Stack direction="row" justifyContent="space-between">
                            <Typography>Annual savings goal (money set aside for savings)</Typography>
                            <Typography>{formatCurrency(annualExpenses)} total</Typography>
                        </Stack>
                    </>
                )}

                {monthlyExpenses.length === 0 && categoryBudgetExpenses === 0 && annualExpenses === 0 && recurringExpenses === 0 && (
                    <Typography>No expenses added.</Typography>
                )}

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                    <Button onClick={() => setIsShowingResults(false)} variant="outlined">Back</Button>
                </Box>
            </Stack>
        </Paper>
    );
};

const RecurringTransactionWidget = ({ onSuccess }) => {
    const [formData, setFormData] = useState({
        merchant_name: '',
        amount: '',
        category: '',
        frequency_type: 'monthly',
        week_day: 'monday',
        month_day: 1,
        end_date: ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    const categories = [
        'Food & Dining',
        'Transportation', 
        'Utilities',
        'Entertainment',
        'Shopping',
        'Healthcare',
        'Education',
        'Travel',
        'Other'
    ];

    const weekDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.merchant_name || !formData.amount || !formData.category) {
            setMessage({ text: 'Please fill in all required fields', type: 'error' });
            return;
        }

        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            
            const payload = {
                merchant_name: formData.merchant_name,
                amount: parseFloat(formData.amount),
                category: formData.category,
                date: new Date().toISOString().split('T')[0], // today's date
                is_recurring: true,
                frequency_type: formData.frequency_type,
                week_day: formData.week_day,
                month_day: formData.month_day,
                end_date: formData.end_date || null
            };

            await axios.post('http://localhost:8000/user_transactions/', payload, {
                headers: { Authorization: `Bearer ${token}` },
                withCredentials: true,
            });

            setMessage({ text: 'Recurring transaction created successfully!', type: 'success' });
            
            // Reset form
            setFormData({
                merchant_name: '',
                amount: '',
                category: '',
                frequency_type: 'monthly',
                week_day: 'monday',
                month_day: 1,
                end_date: ''
            });

            // Call success callback if provided
            if (onSuccess) {
                setTimeout(onSuccess, 1000); // Give user a moment to see success message
            }

        } catch (error) {
            console.error('Error creating recurring transaction:', error);
            setMessage({ text: 'Failed to create recurring transaction', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ 
            p: 2,
            width: '100%',
            maxWidth: 400
        }}>
            <Stack spacing={3}>
                <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            label="Merchant/Description *"
                            value={formData.merchant_name}
                            onChange={(e) => setFormData(prev => ({ ...prev, merchant_name: e.target.value }))}
                            fullWidth
                            size="small"
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            label="Amount ($) *"
                            value={formData.amount}
                            onChange={(e) => {
                                const value = e.target.value;
                                if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                    setFormData(prev => ({ ...prev, amount: value }));
                                }
                            }}
                            fullWidth
                            size="small"
                            inputProps={{ inputMode: 'decimal' }}
                        />
                    </Grid>
                </Grid>

                <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Category *</InputLabel>
                            <Select
                                value={formData.category}
                                label="Category *"
                                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                            >
                                {categories.map((cat) => (
                                    <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Frequency</InputLabel>
                            <Select
                                value={formData.frequency_type}
                                label="Frequency"
                                onChange={(e) => setFormData(prev => ({ ...prev, frequency_type: e.target.value }))}
                            >
                                <MenuItem value="weekly">Weekly</MenuItem>
                                <MenuItem value="monthly">Monthly</MenuItem>
                                <MenuItem value="yearly">Yearly</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>

                {formData.frequency_type === 'weekly' && (
                    <FormControl fullWidth size="small">
                        <InputLabel>Day of Week</InputLabel>
                        <Select
                            value={formData.week_day}
                            label="Day of Week"
                            onChange={(e) => setFormData(prev => ({ ...prev, week_day: e.target.value }))}
                        >
                            {weekDays.map((day) => (
                                <MenuItem key={day} value={day}>
                                    {day.charAt(0).toUpperCase() + day.slice(1)}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                )}

                {formData.frequency_type === 'monthly' && (
                    <TextField
                        label="Day of Month (1-31)"
                        value={formData.month_day}
                        onChange={(e) => {
                            const value = e.target.value;
                            if (value === '' || (/^\d+$/.test(value) && parseInt(value) >= 1 && parseInt(value) <= 31)) {
                                setFormData(prev => ({ ...prev, month_day: parseInt(value) || 1 }));
                            }
                        }}
                        fullWidth
                        size="small"
                        inputProps={{ inputMode: 'numeric' }}
                    />
                )}

                <TextField
                    label="End Date (Optional)"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                    fullWidth
                    size="small"
                    InputLabelProps={{ shrink: true }}
                />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={loading}
                        sx={{ minWidth: 150, py: 1 }}
                    >
                        {loading ? 'Creating...' : 'Add Recurring Transaction'}
                    </Button>
                    
                    {message.text && (
                        <Typography 
                            variant="body2" 
                            color={message.type === 'error' ? 'error.main' : 'success.main'}
                            sx={{ ml: 2, fontWeight: 500 }}
                        >
                            {message.text}
                        </Typography>
                    )}
                </Box>
            </Stack>
        </Box>
    );
};