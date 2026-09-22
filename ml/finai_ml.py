"""Runnable Scikit-learn reference implementation for FinAI.

The browser dashboard mirrors these operations with lightweight client-side
functions so the demo remains instant. This module shows the academic
implementation using the requested Scikit-learn algorithms.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable

import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline


TRAINING_EXAMPLES = [
    ("swiggy dinner biryani", "Food"),
    ("zomato lunch", "Food"),
    ("grocery supermarket", "Food"),
    ("amazon headphones", "Shopping"),
    ("flipkart shoes", "Shopping"),
    ("mall clothing", "Shopping"),
    ("uber ride", "Transportation"),
    ("ola cab", "Transportation"),
    ("metro card recharge", "Transportation"),
    ("electricity bill", "Bills"),
    ("internet broadband", "Bills"),
    ("mobile recharge", "Bills"),
    ("netflix subscription", "Entertainment"),
    ("movie tickets", "Entertainment"),
    ("spotify plan", "Entertainment"),
    ("pharmacy medicine", "Healthcare"),
    ("doctor consultation", "Healthcare"),
    ("course tuition", "Education"),
    ("online class", "Education"),
    ("mutual fund sip", "Investment"),
    ("stock purchase", "Investment"),
    ("monthly rent", "Rent"),
    ("salary credit", "Salary"),
]


@dataclass
class Classification:
    category: str
    confidence: float


def train_category_model() -> Pipeline:
    """Train TF-IDF + Logistic Regression on a small labeled vocabulary."""
    descriptions, categories = zip(*TRAINING_EXAMPLES)
    model = Pipeline(
        [
            ("tfidf", TfidfVectorizer(ngram_range=(1, 2), lowercase=True)),
            ("classifier", LogisticRegression(max_iter=1000, random_state=42)),
        ]
    )
    model.fit(descriptions, categories)
    return model


def classify_description(model: Pipeline, description: str) -> Classification:
    """Return the most likely category and model probability."""
    probabilities = model.predict_proba([description])[0]
    index = int(np.argmax(probabilities))
    return Classification(
        category=str(model.classes_[index]),
        confidence=float(probabilities[index]),
    )


def detect_anomalies(
    transactions: pd.DataFrame, contamination: float = 0.12
) -> pd.DataFrame:
    """Apply IsolationForest to transaction amount features.

    Expected columns: amount. Optional columns date and category are kept in
    the returned frame for display. The result includes anomaly_label and
    anomaly_score. A label of -1 is a statistical anomaly, not fraud.
    """
    if transactions.empty:
        return transactions.assign(anomaly_label=pd.Series(dtype=int))

    values = transactions[["amount"]].astype(float).to_numpy()
    if len(values) < 5:
        return transactions.assign(
            anomaly_label=1,
            anomaly_score=0.0,
        )

    model = IsolationForest(
        contamination=min(max(contamination, 0.01), 0.49),
        random_state=42,
        n_estimators=150,
    )
    result = transactions.copy()
    result["anomaly_label"] = model.fit_predict(values)
    result["anomaly_score"] = model.decision_function(values)
    return result


def analyze_spending(transactions: pd.DataFrame) -> dict[str, object]:
    """Return simple EDA metrics used in the financial insights view."""
    expenses = transactions[transactions["type"].str.lower() == "expense"].copy()
    if expenses.empty:
        return {"total_expenses": 0.0, "category_share": {}, "monthly": {}}
    expenses["date"] = pd.to_datetime(expenses["date"])
    category_share = (
        expenses.groupby("category")["amount"].sum()
        .sort_values(ascending=False)
        .div(expenses["amount"].sum())
        .round(4)
        .to_dict()
    )
    monthly = (
        expenses.assign(month=expenses["date"].dt.to_period("M").astype(str))
        .groupby("month")["amount"]
        .sum()
        .round(2)
        .to_dict()
    )
    return {
        "total_expenses": float(expenses["amount"].sum()),
        "category_share": category_share,
        "monthly": monthly,
    }


def demo() -> None:
    """Small CLI demonstration for a viva or local verification."""
    model = train_category_model()
    for description in ["Swiggy dinner", "Uber ride", "Amazon headphones"]:
        result = classify_description(model, description)
        print(f"{description}: {result.category} ({result.confidence:.1%})")

    frame = pd.DataFrame(
        [
            {"date": "2026-09-01", "description": "Salary", "amount": 85000, "type": "Income", "category": "Salary"},
            {"date": "2026-09-02", "description": "Swiggy", "amount": 450, "type": "Expense", "category": "Food"},
            {"date": "2026-09-03", "description": "Large purchase", "amount": 18500, "type": "Expense", "category": "Shopping"},
            {"date": "2026-09-04", "description": "Uber", "amount": 320, "type": "Expense", "category": "Transportation"},
            {"date": "2026-09-05", "description": "Netflix", "amount": 649, "type": "Expense", "category": "Entertainment"},
        ]
    )
    print(detect_anomalies(frame).to_string(index=False))
    print(analyze_spending(frame))


if __name__ == "__main__":
    demo()