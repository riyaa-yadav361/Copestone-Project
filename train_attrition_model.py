import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import f1_score

if __name__ == '__main__':
    df = pd.read_csv('data/HR_Employee_Attrition.csv')
    drop_cols = [c for c in ['EmployeeCount', 'Over18', 'StandardHours', 'EmployeeNumber'] if c in df.columns]
    df = df.drop(columns=drop_cols, errors='ignore')
    df['Attrition'] = df['Attrition'].map({'Yes': 1, 'No': 0})
    categorical_cols = df.select_dtypes(include=['object']).columns.tolist()
    encoder = LabelEncoder()
    for col in categorical_cols:
        df[col] = encoder.fit_transform(df[col].astype(str))
    X = df[[col for col in df.columns if col != 'Attrition']]
    y = df['Attrition']
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.22, random_state=42, stratify=y)

    models = {
        'logistic': LogisticRegression(max_iter=1200, random_state=42),
        'tree': DecisionTreeClassifier(random_state=42),
        'forest': RandomForestClassifier(n_estimators=140, random_state=42)
    }

    best_model = None
    best_f1 = 0.0
    best_name = ''

    for name, model in models.items():
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)
        f1 = f1_score(y_test, y_pred)
        print(name, 'f1', f1)
        if f1 > best_f1:
            best_f1 = f1
            best_model = model
            best_name = name

    if best_model is not None:
        joblib.dump(best_model, 'model/attrition_model.pkl')
        print('Saved best model:', best_name, 'with f1 score', best_f1)
    else:
        print('No model saved.')
