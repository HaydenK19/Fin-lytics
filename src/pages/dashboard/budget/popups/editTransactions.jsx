import React, { useState, useEffect } from "react";
import "../../../../components/popups/modal.scss";
import "./editTran.scss";
import api from "../../../../api";

const EditTransactions = ({ onClose, transaction }) => {
    const [amount, setAmount] = useState(transaction ? transaction.amount : 0);
    const [date, setDate] = useState(transaction ? transaction.date : new Date().toISOString().split('T')[0]);
    const [description, setDescription] = useState(transaction ? transaction.description : "");
    const [categoryId, setCategoryId] = useState(transaction ? transaction.category_id : null);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Get user ID from token
    const getUserIdFromToken = () => {
        const token = localStorage.getItem("token");
        if (!token) return null;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.id;
        } catch (error) {
            return null;
        }
    };

    // Fetch user's categories
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                setLoading(true);
                const userId = getUserIdFromToken();
                if (!userId) throw new Error("User not authenticated");
                const token = localStorage.getItem("token");
                const response = await api.get(`/user_categories/${userId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setCategories(response.data);
            } catch (error) {
                console.error("Error fetching categories:", error);
                setError("Failed to load categories");
            } finally {
                setLoading(false);
            }
        };
        fetchCategories();
    }, []);

    // Handle form submission (add or edit)
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const userId = getUserIdFromToken();
            if (!userId) throw new Error("User not authenticated");
            const token = localStorage.getItem("token");
            if (transaction && transaction.transaction_id) {
                // Edit existing transaction
                await api.put(`/entered_transactions/${transaction.transaction_id}`, {
                    date,
                    amount,
                    description,
                    category_id: categoryId,
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                alert("Transaction updated successfully!");
            } else {
                // Add new transaction
                await api.post("/entered_transactions/", {
                    user_id: userId,
                    date,
                    amount,
                    description,
                    category_id: categoryId,
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                alert("Transaction created successfully!");
            }
            onClose();
        } catch (error) {
            console.error("Error saving transaction:", error);
            setError("Failed to save transaction");
        }
    };

    if (loading) return <div>Loading categories...</div>;
    if (error) return <div style={{ color: 'red' }}>{error}</div>;

    return (
        <div className="modal" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="close-btn" onClick={onClose}>x</button>
                <h2>{transaction ? "Edit Transaction" : "Add Transaction"}</h2>
                <form onSubmit={handleSubmit}>
                    <div>
                        <label>Amount:</label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(parseFloat(e.target.value))}
                            required
                        />
                    </div>
                    <div>
                        <label>Date:</label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label>Description:</label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Enter transaction description"
                        />
                    </div>
                    <div>
                        <label>Category:</label>
                        <select
                            value={categoryId || ""}
                            onChange={(e) => setCategoryId(parseInt(e.target.value))}
                            required
                        >
                            <option value="" disabled>Select a category</option>
                            {categories.map((category) => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <button type="submit">{transaction ? "Save Changes" : "Save Transaction"}</button>
                </form>
            </div>
        </div>
    );
};

export default EditTransactions;