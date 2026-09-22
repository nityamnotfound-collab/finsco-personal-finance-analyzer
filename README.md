# FinAI — AI/ML Personal Finance Analyzer

FinAI is a polished personal finance analysis dashboard built for a BCA AI/ML project demonstration. It accepts manual transactions and CSV uploads, calculates financial metrics from the user's data, visualizes spending patterns, classifies descriptions, detects statistical anomalies, tracks a manually-priced stock portfolio, and produces downloadable reports.

## Features

- Demo mode with several months of fictional salary, expenses, investments, and unusual transactions
- Manual transaction create, edit, delete, and search
- CSV import with flexible column matching and validation
- Dynamic dashboard KPIs, category breakdowns, monthly income/expense trends, savings trend, and recent activity
- Expense analyzer with date, type, category, and search filters
- AI/ML analysis page with category classification, confidence, anomaly detection, and spending pattern analysis
- Financial insights generated from the live transaction dataset
- Stock portfolio tracking with manually entered current prices and calculated allocation/P&L
- Downloadable transaction CSV, summary CSV, analysis CSV, and printable HTML report
- Browser persistence using localStorage, so a demo survives navigation and refreshes

## Technologies

- React + TypeScript + Vite
- Recharts for interactive visualizations
- Tailwind CSS and lucide-react for the interface
- localStorage for lightweight demo persistence
- Python companion module using Pandas, NumPy, and Scikit-learn

## AI/ML techniques

The browser experience includes a fast, dependency-free implementation of the same analytical ideas so the demo works instantly in a Replit preview:

1. **Data preprocessing** cleans dates, amounts, descriptions, and flexible CSV headers.
2. **TF-IDF + Logistic Regression concept** maps transaction descriptions to a category and exposes a confidence score. The production reference implementation lives in `ml/finai_ml.py`.
3. **Isolation Forest concept** flags transactions whose amount and relative spending scale differ from the user's history. Anomaly labels are statistical signals, not fraud determinations.
4. **Exploratory data analysis** groups transactions by category and month to surface trends, recurring categories, top spending periods, and savings rate.

Run the actual Scikit-learn reference module with:

```bash
pip install -r requirements.txt
python -m ml.finai_ml
```

## How to run

```bash
pnpm install
pnpm --filter @workspace/finai run dev
```

The browser app is designed to run without credentials, bank connections, or external APIs. Click **Load demo data** to populate the dashboard immediately, or start with a manual transaction / CSV upload.

## Project structure

```text
artifacts/finai/       React + Vite application
  src/App.tsx          Product shell and app behavior
  src/index.css        FinAI visual system
ml/finai_ml.py         Runnable Scikit-learn reference implementation
requirements.txt       Python analysis dependencies
```

## Future scope

- Optional authenticated multi-user persistence
- Server-side model training and saved model metrics
- More robust multilingual transaction classification
- Time-series forecasting for cash flow scenarios
- Broker integrations that clearly identify live market data sources

This project does not request banking passwords, card numbers, or account credentials. Portfolio prices are explicitly entered by the user and are not presented as live market data.