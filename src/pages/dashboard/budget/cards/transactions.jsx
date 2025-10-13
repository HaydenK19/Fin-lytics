import "./card.scss";
import React, { useEffect, useState } from "react";
import axios from "axios";
import EditTransactions from "../popups/editTransactions.jsx";

const TransactionCard = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editTx, setEditTx] = useState(null);

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                const token = localStorage.getItem("token");
                const response = await axios.get("http://localhost:8000/entered_transactions/combined", {
                    headers: { Authorization: `Bearer ${token}` },
                    withCredentials: true,
                });

                // Get transactions from the last 30 days
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

                const recentTransactions = response.data.all_transactions
                    .filter(tx => new Date(tx.date) >= thirtyDaysAgo)
                    .sort((a, b) => new Date(b.date) - new Date(a.date));

                setTransactions(recentTransactions);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching transactions:", error);
                setError("No transactions in the past 30 days");
                setLoading(false);
            }
        };

        fetchTransactions();
    }, []);

    const handleDelete = async (transaction_id) => {
        if (!window.confirm("Are you sure you want to delete this transaction?")) return;
        try {
            const token = localStorage.getItem("token");
            await axios.delete(`http://localhost:8000/entered_transactions/${transaction_id}`, {
                headers: { Authorization: `Bearer ${token}` },
                withCredentials: true,
            });
            setTransactions(transactions.filter(tx => tx.transaction_id !== transaction_id));
        } catch (error) {
            alert("Failed to delete transaction");
        }
    };

    const openModal = (tx = null) => {
        setEditTx(tx);
        setIsModalOpen(true);
    };
    const closeModal = () => {
        setEditTx(null);
        setIsModalOpen(false);
    };

    const refreshTransactions = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get("http://localhost:8000/entered_transactions/combined", {
                headers: { Authorization: `Bearer ${token}` },
                withCredentials: true,
            });
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const recentTransactions = (response.data.all_transactions || [])
                .filter(tx => new Date(tx.date) >= thirtyDaysAgo)
                .sort((a, b) => new Date(b.date) - new Date(a.date));
            setTransactions(recentTransactions);
        } catch (error) {
            setError("No transactions in the past 30 days");
        }
        setLoading(false);
    };

    if (loading) return <div className="transaction-card">Loading transactions...</div>;
    if (error) return <div className="transaction-card error">{error}</div>;

    return (
        <div className="transaction-card">
            <button className="add-button" onClick={() => openModal(null)}>+ Add Transaction</button>
            <div className="transactions-list">
                {transactions.length === 0 ? (
                    <p>No transactions in the past 30 days</p>
                ) : (
                    transactions.map((tx) => (
                        <div key={tx.transaction_id} className="transaction-item">
                            <div className="transaction-info">
                                <span className="merchant">
                                    {tx.description || tx.merchant_name || tx.category || 'Unknown'}
                                </span>
                                <span className="date">
                                    {new Date(tx.date).toLocaleDateString('en-US', {
                                        month: 'numeric',
                                        day: 'numeric',
                                        year: 'numeric'
                                    })}
                                </span>
                            </div>
                            <span className={`amount ${tx.amount < 0 ? 'negative' : 'positive'}`}>
                                ${Math.abs(tx.amount).toFixed(2)}
                            </span>
                            <button className="edit-btn" onClick={() => openModal(tx)}>Edit</button>
                            <button className="delete-btn" onClick={() => handleDelete(tx.transaction_id)}>Delete</button>
                        </div>
                    ))
                )}
            </div>
            {isModalOpen && (
                <EditTransactions
                    onClose={() => { closeModal(); refreshTransactions(); }}
                    transaction={editTx}
                />
            )}
        </div>
    );
}

export default TransactionCard;