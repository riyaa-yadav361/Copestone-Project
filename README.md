# Workforce Attrition Intelligence System (WAIS)

## Project Overview
WAIS is a professional HR analytics capstone project that predicts employee attrition risk using historical workforce data. It blends data analysis, SQL business insights, machine learning, natural language recommendation generation, Power BI dashboard design, and a polished frontend UI.

## Project Structure

WAIS_Project/
├── data/
│   └── HR_Employee_Attrition.csv
├── notebook/
│   └── WAIS_Model_Training.ipynb
├── sql/
│   └── HR_Attrition_Queries.sql
├── model/
│   └── attrition_model.pkl
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── script.js
├── powerbi/
│   └── WAIS_Dashboard.pbix
└── README.md

## How to Use

1. Open `notebook/WAIS_Model_Training.ipynb` in Jupyter Notebook or JupyterLab.
2. Run the notebook cells to:
   - load and clean the HR attrition data
   - perform exploratory data analysis
   - train and evaluate classification models
   - generate attrition risk recommendations using NLTK logic
   - save the best model to `model/attrition_model.pkl`
3. Use the SQL queries in `sql/HR_Attrition_Queries.sql` to analyze attrition insights in your SQL database.
5. Run the backend server with `py -3 server.py` from the project root, then open `http://localhost:8000` in a browser.
6. Sign up or login with your HR account; user credentials and HR records are saved in SQLite at `wais_data.db`.
7. The `powerbi/WAIS_Dashboard.pbix` file is included as a placeholder for the dashboard design.

## Technologies Used
- Python for data loading, preprocessing, machine learning, and recommendation generation
- SQL for structured data storage and HR analytics queries
- Scikit-learn for attrition classification modeling
- NLTK for generating text-based HR recommendations
- Power BI for interactive visual analytics
- HTML, CSS, JavaScript for building the frontend web interface

## Presentation Notes
This project is designed for a college capstone submission and portfolio. It demonstrates:
- data science workflow from raw dataset to model delivery
- business intelligence via SQL and dashboarding
- modern UI/UX design for HR analytics platforms
- integration of predictive modeling with actionable human-centered recommendations

## Notes
- `data/HR_Employee_Attrition.csv` contains the cleaned dataset used for model training.
- `model/attrition_model.pkl` is the trained attrition prediction model saved with `joblib`.
- `powerbi/WAIS_Dashboard.pbix` is a placeholder file representing the dashboard deliverable.
