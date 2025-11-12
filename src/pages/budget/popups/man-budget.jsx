import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    IconButton,
    Typography,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Box,
    Stack,
    CircularProgress,
    Alert,
    Snackbar,
} from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPencil } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";

const ManageBudgets = ({ onClose }) => {
    const [annualBudget, setAnnualBudget] = useState(null);
    const [categories, setCategories] = useState([]);
    const [isEditingAnnual, setIsEditingAnnual] = useState(false);
    const [newCategory, setNewCategory] = useState({ name: "", current: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [editingCategory, setEditingCategory] = useState(null);

    //category options
    const commonCategories = [
        "Food & Dining",
        "Entertainment", 
        "Transportation",
        "Utilities",
        "Healthcare",
        "Shopping",
        "Travel",
        "Education",
        "Insurance",
        "Personal Care",
        "Subscriptions",
        "Other"
    ];

    //fetch budget goals on component mount
    useEffect(() => {
        fetchBudgetGoals();
    }, []);

    const fetchBudgetGoals = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            
            //annual goals
            const annualResponse = await axios.get('http://localhost:8000/budget-goals/?goal_type=annual', {
                headers: { Authorization: `Bearer ${token}` },
                withCredentials: true,
            });
            
            //categorical goals
            const categoryResponse = await axios.get('http://localhost:8000/budget-goals/?goal_type=category', {
                headers: { Authorization: `Bearer ${token}` },
                withCredentials: true,
            });
            
            //annual budget (take first one or create default structure)
            if (annualResponse.data.length > 0) {
                setAnnualBudget({
                    id: annualResponse.data[0].id,
                    name: annualResponse.data[0].goal_name,
                    amount: annualResponse.data[0].goal_amount,
                    current: 0, //need to calculate this from transactions
                });
            } else {
                setAnnualBudget({
                    name: "Annual Savings Goal",
                    amount: 50000,
                    current: 0,
                });
            }
            
            //category goals
            const categoryGoals = categoryResponse.data.map(goal => ({
                id: goal.id,
                name: goal.category_name,
                current: goal.goal_amount,
                actual: 0,
                budgetName: goal.goal_name
            }));
            
            setCategories(categoryGoals);
            
        } catch (error) {
            console.error('Error fetching budget goals:', error);
            setError('Failed to load budget goals');
        } finally {
            setLoading(false);
        }
    };

    const handleAnnualEdit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            
            if (annualBudget.id) {
                // Update existing goal
                await axios.put(`http://localhost:8000/budget-goals/${annualBudget.id}`, {
                    goal_name: annualBudget.name,
                    goal_amount: parseFloat(annualBudget.amount),
                }, {
                    headers: { Authorization: `Bearer ${token}` },
                    withCredentials: true,
                });
            } else {
                // Create new goal
                const response = await axios.post('http://localhost:8000/budget-goals/', {
                    goal_type: 'annual',
                    goal_name: annualBudget.name,
                    goal_amount: parseFloat(annualBudget.amount),
                    time_period: 'yearly'
                }, {
                    headers: { Authorization: `Bearer ${token}` },
                    withCredentials: true,
                });
                
                setAnnualBudget(prev => ({ ...prev, id: response.data.id }));
            }
            
            setSnackbar({ open: true, message: 'Annual goal saved successfully!', severity: 'success' });
            setIsEditingAnnual(false);
            
        } catch (error) {
            console.error('Error saving annual goal:', error);
            setSnackbar({ open: true, message: 'Failed to save annual goal', severity: 'error' });
        }
    };

    const handleAddCategory = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            
            const response = await axios.post('http://localhost:8000/budget-goals/', {
                goal_type: 'category',
                goal_name: `${newCategory.name} Budget`,
                goal_amount: parseFloat(newCategory.current),
                time_period: 'monthly',
                category_name: newCategory.name
            }, {
                headers: { Authorization: `Bearer ${token}` },
                withCredentials: true,
            });
            
            const newCategoryGoal = {
                id: response.data.id,
                name: newCategory.name,
                current: newCategory.current,
                actual: 0,
                budgetName: response.data.goal_name
            };
            
            setCategories(prev => [...prev, newCategoryGoal]);
            setNewCategory({ name: "", current: 0 });
            setSnackbar({ open: true, message: 'Category added successfully!', severity: 'success' });
            
        } catch (error) {
            console.error('Error adding category:', error);
            setSnackbar({ open: true, message: 'Failed to add category', severity: 'error' });
        }
    };

    const handleUpdateCategory = async (categoryId, updatedData) => {
        try {
            const token = localStorage.getItem('token');
            
            await axios.put(`http://localhost:8000/budget-goals/${categoryId}`, {
                goal_amount: parseFloat(updatedData.current),
                category_name: updatedData.name
            }, {
                headers: { Authorization: `Bearer ${token}` },
                withCredentials: true,
            });
            
            setCategories(prev => 
                prev.map(cat => 
                    cat.id === categoryId 
                        ? { ...cat, name: updatedData.name, current: updatedData.current }
                        : cat
                )
            );
            
            setEditingCategory(null);
            setSnackbar({ open: true, message: 'Category updated successfully!', severity: 'success' });
            
        } catch (error) {
            console.error('Error updating category:', error);
            setSnackbar({ open: true, message: 'Failed to update category', severity: 'error' });
        }
    };

    const handleDeleteCategory = async (categoryId) => {
        try {
            const token = localStorage.getItem('token');
            
            await axios.delete(`http://localhost:8000/budget-goals/${categoryId}`, {
                headers: { Authorization: `Bearer ${token}` },
                withCredentials: true,
            });
            
            setCategories(prev => prev.filter(cat => cat.id !== categoryId));
            setSnackbar({ open: true, message: 'Category deleted successfully!', severity: 'success' });
            
        } catch (error) {
            console.error('Error deleting category:', error);
            setSnackbar({ open: true, message: 'Failed to delete category', severity: 'error' });
        }
    };

    if (loading) {
        return (
            <Dialog open onClose={onClose} fullWidth maxWidth="md">
                <DialogContent>
                    <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                        <CircularProgress />
                    </Box>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open onClose={onClose} fullWidth maxWidth="md">
            <DialogTitle sx={{ position: 'relative', pb: 1 }}>
                Manage Budget Projections
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
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}
                <Typography variant="h6" sx={{ mb: 1 }}>Annual Savings Goal:</Typography>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 600, py: 1 }}>Annual Goal</TableCell>
                            <TableCell sx={{ fontWeight: 600, py: 1 }}>Working</TableCell>
                            <TableCell sx={{ fontWeight: 600, py: 1 }}>Remainder</TableCell>
                            <TableCell sx={{ fontWeight: 600, py: 1 }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        <TableRow>
                            {isEditingAnnual ? (
                                <TableCell sx={{ py: 1 }}>
                                    <form onSubmit={handleAnnualEdit}>
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <TextField
                                                label="Goal Name"
                                                value={annualBudget.name}
                                                onChange={(e) =>
                                                    setAnnualBudget((prev) => ({
                                                        ...prev,
                                                        name: e.target.value,
                                                    }))
                                                }
                                                size="small"
                                                sx={{ width: 150 }}
                                            />
                                            <TextField
                                                label="Amount"
                                                type="number"
                                                value={annualBudget.amount}
                                                onChange={(e) =>
                                                    setAnnualBudget((prev) => ({
                                                        ...prev,
                                                        amount: parseInt(e.target.value) || 0,
                                                    }))
                                                }
                                                size="small"
                                                sx={{ width: 120 }}
                                            />
                                            <Button 
                                                type="submit" 
                                                size="small" 
                                                variant="contained"
                                                sx={{ 
                                                    backgroundColor: '#2563eb',
                                                    minWidth: 60,
                                                    '&:hover': { backgroundColor: '#1d4ed8' }
                                                }}
                                            >
                                                Save
                                            </Button>
                                        </Stack>
                                    </form>
                                </TableCell>
                            ) : (
                                <TableCell sx={{ py: 1, fontWeight: 500 }}>${annualBudget?.amount?.toLocaleString() || 0}</TableCell>
                            )}
                            <TableCell sx={{ py: 1 }}>${annualBudget?.current?.toLocaleString() || 0}</TableCell>
                            <TableCell sx={{ py: 1, color: (annualBudget?.amount || 0) - (annualBudget?.current || 0) >= 0 ? 'success.main' : 'error.main' }}>
                                ${((annualBudget?.amount || 0) - (annualBudget?.current || 0)).toLocaleString()}
                            </TableCell>
                            <TableCell sx={{ py: 1 }}>
                                <IconButton 
                                    onClick={() => setIsEditingAnnual(true)} 
                                    size="small"
                                    sx={{ color: '#2563eb' }}
                                >
                                    <EditIcon fontSize="small" />
                                </IconButton>
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>

                <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
                    Categorical Budget Goals:
                </Typography>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 600, py: 1 }}>Category</TableCell>
                            <TableCell sx={{ fontWeight: 600, py: 1 }}>Monthly Goal</TableCell>
                            <TableCell sx={{ fontWeight: 600, py: 1 }}>Current Spent</TableCell>
                            <TableCell sx={{ fontWeight: 600, py: 1 }}>Remaining</TableCell>
                            <TableCell sx={{ fontWeight: 600, py: 1 }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {categories.map((category) => (
                            <TableRow key={category.id}>
                                {editingCategory === category.id ? (
                                    <>
                                        <TableCell sx={{ py: 1 }}>
                                            <TextField
                                                value={category.name}
                                                onChange={(e) => 
                                                    setCategories(prev => 
                                                        prev.map(cat => 
                                                            cat.id === category.id 
                                                                ? { ...cat, name: e.target.value }
                                                                : cat
                                                        )
                                                    )
                                                }
                                                size="small"
                                                fullWidth
                                            />
                                        </TableCell>
                                        <TableCell sx={{ py: 1 }}>
                                            <TextField
                                                type="number"
                                                value={category.current}
                                                onChange={(e) => 
                                                    setCategories(prev => 
                                                        prev.map(cat => 
                                                            cat.id === category.id 
                                                                ? { ...cat, current: parseFloat(e.target.value) || 0 }
                                                                : cat
                                                        )
                                                    )
                                                }
                                                size="small"
                                                fullWidth
                                            />
                                        </TableCell>
                                        <TableCell sx={{ py: 1 }}>${category.actual?.toLocaleString() || 0}</TableCell>
                                        <TableCell sx={{ 
                                            py: 1, 
                                            color: (category.current || 0) - (category.actual || 0) >= 0 ? 'success.main' : 'error.main',
                                            fontWeight: 500
                                        }}>
                                            ${((category.current || 0) - (category.actual || 0)).toLocaleString()}
                                        </TableCell>
                                        <TableCell sx={{ py: 1 }}>
                                            <Stack direction="row" spacing={0.5}>
                                                <Button 
                                                    size="small" 
                                                    onClick={() => handleUpdateCategory(category.id, category)}
                                                    sx={{ minWidth: 'auto', px: 1 }}
                                                >
                                                    Save
                                                </Button>
                                                <Button 
                                                    size="small" 
                                                    onClick={() => setEditingCategory(null)}
                                                    sx={{ minWidth: 'auto', px: 1 }}
                                                >
                                                    Cancel
                                                </Button>
                                            </Stack>
                                        </TableCell>
                                    </>
                                ) : (
                                    <>
                                        <TableCell sx={{ py: 1, fontWeight: 500 }}>{category.name}</TableCell>
                                        <TableCell sx={{ py: 1 }}>${category.current?.toLocaleString() || 0}</TableCell>
                                        <TableCell sx={{ py: 1 }}>${category.actual?.toLocaleString() || 0}</TableCell>
                                        <TableCell sx={{ 
                                            py: 1, 
                                            color: (category.current || 0) - (category.actual || 0) >= 0 ? 'success.main' : 'error.main',
                                            fontWeight: 500
                                        }}>
                                            ${((category.current || 0) - (category.actual || 0)).toLocaleString()}
                                        </TableCell>
                                        <TableCell sx={{ py: 1 }}>
                                            <Stack direction="row" spacing={0.5}>
                                                <IconButton 
                                                    size="small" 
                                                    onClick={() => setEditingCategory(category.id)}
                                                    sx={{ color: 'primary.main' }}
                                                >
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                                <IconButton 
                                                    size="small" 
                                                    onClick={() => handleDeleteCategory(category.id)}
                                                    sx={{ color: 'error.main' }}
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Stack>
                                        </TableCell>
                                    </>
                                )}
                            </TableRow>
                        ))}
                        {categories.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} sx={{ py: 2, textAlign: 'center', color: 'text.secondary', fontStyle: 'italic' }}>
                                    No categories added yet. Add an expense category below.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>

                <Box sx={{ mt: 2, p: 2, backgroundColor: '#f8f9fa', borderRadius: 1 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
                        Add New Category
                    </Typography>
                    <form onSubmit={handleAddCategory}>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="end">
                            <FormControl size="small" sx={{ minWidth: 200 }}>
                                <InputLabel>Category</InputLabel>
                                <Select
                                    value={newCategory.name}
                                    label="Category"
                                    onChange={(e) =>
                                        setNewCategory((prev) => ({ ...prev, name: e.target.value }))
                                    }
                                >
                                    {commonCategories.map((category) => (
                                        <MenuItem key={category} value={category}>
                                            {category}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <TextField
                                label="Monthly Goal ($)"
                                type="number"
                                value={newCategory.current}
                                onChange={(e) =>
                                    setNewCategory((prev) => ({ ...prev, current: parseInt(e.target.value) || 0 }))
                                }
                                size="small"
                                sx={{ minWidth: 140 }}
                            />
                            <Button 
                                type="submit" 
                                variant="contained" 
                                disabled={!newCategory.name || newCategory.current <= 0}
                                sx={{
                                    backgroundColor: '#2563eb',
                                    minWidth: 120,
                                    '&:hover': {
                                        backgroundColor: '#1d4ed8'
                                    }
                                }}
                            >
                                Add Category
                            </Button>
                        </Stack>
                    </form>
                </Box>
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
            
            <Snackbar 
                open={snackbar.open} 
                autoHideDuration={6000} 
                onClose={() => setSnackbar({ ...snackbar, open: false })}
            >
                <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Dialog>
    );
};

export default ManageBudgets;