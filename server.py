import json
import os
import sqlite3
import hashlib
import datetime
import urllib.parse
from http.server import BaseHTTPRequestHandler, HTTPServer
from socketserver import ThreadingMixIn
import mimetypes

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, 'frontend')
DB_PATH = os.path.join(BASE_DIR, 'wais_data.db')

SAMPLE_EMPLOYEES = [
    {'employee_id': 1010, 'department': 'Sales', 'job_role': 'Sales Executive', 'monthly_income': 5600, 'risk': 'High', 'key_factor': 'OverTime'},
    {'employee_id': 1022, 'department': 'Research & Dev', 'job_role': 'Research Scientist', 'monthly_income': 6600, 'risk': 'Medium', 'key_factor': 'JobSatisfaction'},
    {'employee_id': 1034, 'department': 'Human Resources', 'job_role': 'Human Resources', 'monthly_income': 5200, 'risk': 'High', 'key_factor': 'WorkLifeBalance'},
    {'employee_id': 1046, 'department': 'Sales', 'job_role': 'Sales Representative', 'monthly_income': 4500, 'risk': 'Medium', 'key_factor': 'DistanceFromHome'},
    {'employee_id': 1058, 'department': 'Research & Dev', 'job_role': 'Laboratory Technician', 'monthly_income': 4900, 'risk': 'High', 'key_factor': 'LowSatisfaction'},
]


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode('utf-8')).hexdigest()


def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute(
        '''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
        '''
    )
    cursor.execute(
        '''
        CREATE TABLE IF NOT EXISTS employees (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            employee_id INTEGER NOT NULL,
            department TEXT NOT NULL,
            job_role TEXT NOT NULL,
            monthly_income INTEGER NOT NULL,
            risk TEXT NOT NULL,
            key_factor TEXT NOT NULL,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
        '''
    )
    cursor.execute(
        '''
        CREATE TABLE IF NOT EXISTS predictions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            created_at TEXT NOT NULL,
            risk TEXT NOT NULL,
            probability REAL NOT NULL,
            factors TEXT NOT NULL,
            employee_age INTEGER,
            department TEXT,
            job_role TEXT,
            monthly_income INTEGER,
            overtime TEXT,
            job_satisfaction INTEGER,
            work_life_balance INTEGER,
            years_at_company INTEGER,
            distance_from_home INTEGER,
            marital_status TEXT,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
        '''
    )
    conn.commit()
    conn.close()


def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def create_user(name: str, email: str, password: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    password_hash = hash_password(password)
    created_at = datetime.datetime.utcnow().isoformat()
    cursor.execute(
        'INSERT INTO users (name, email, password_hash, created_at) VALUES (?, ?, ?, ?)',
        (name, email, password_hash, created_at),
    )
    user_id = cursor.lastrowid
    for employee in SAMPLE_EMPLOYEES:
        cursor.execute(
            'INSERT INTO employees (user_id, employee_id, department, job_role, monthly_income, risk, key_factor) VALUES (?, ?, ?, ?, ?, ?, ?)',
            (user_id, employee['employee_id'], employee['department'], employee['job_role'], employee['monthly_income'], employee['risk'], employee['key_factor']),
        )
    conn.commit()
    conn.close()
    return {'id': user_id, 'name': name, 'email': email}


def find_user_by_email(email: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM users WHERE email = ?', (email,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None


def fetch_employee_rows(user_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        'SELECT employee_id, department, job_role, monthly_income, risk, key_factor FROM employees WHERE user_id = ? ORDER BY employee_id ASC',
        (user_id,),
    )
    rows = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return rows


def create_prediction(user_id: int, risk: str, probability: float, factors: str, payload: dict):
    conn = get_db_connection()
    cursor = conn.cursor()
    created_at = datetime.datetime.utcnow().isoformat()
    cursor.execute(
        '''
        INSERT INTO predictions (
            user_id, created_at, risk, probability, factors,
            employee_age, department, job_role, monthly_income,
            overtime, job_satisfaction, work_life_balance,
            years_at_company, distance_from_home, marital_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''',
        (
            user_id,
            created_at,
            risk,
            probability,
            factors,
            payload.get('age'),
            payload.get('department'),
            payload.get('jobRole'),
            payload.get('monthlyIncome'),
            payload.get('overtime'),
            payload.get('jobSatisfaction'),
            payload.get('workLifeBalance'),
            payload.get('yearsAtCompany'),
            payload.get('distanceFromHome'),
            payload.get('maritalStatus'),
        ),
    )
    conn.commit()
    conn.close()


def fetch_recent_prediction(user_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        'SELECT created_at, risk, probability, factors FROM predictions WHERE user_id = ? ORDER BY id DESC LIMIT 1',
        (user_id,),
    )
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None


def calculate_counts(employees):
    total = len(employees)
    high_risk = sum(1 for row in employees if row['risk'].lower() == 'high')
    average_income = round(sum(row['monthly_income'] for row in employees) / total) if total else 0
    attrition_rate = round((high_risk / total) * 100) if total else 0
    return {
        'totalEmployees': total,
        'highRiskCount': high_risk,
        'averageIncome': average_income,
        'attritionRate': attrition_rate,
    }


class WAISHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        # Suppress noisy logs; comment this out to re-enable
        pass

    def _set_headers(self, content_type='application/json', status=200):
        self.send_response(status)
        self.send_header('Content-Type', content_type)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        self.end_headers()

    def send_json(self, payload, status=200):
        self._set_headers('application/json', status)
        self.wfile.write(json.dumps(payload).encode('utf-8'))

    def do_OPTIONS(self):
        self._set_headers('application/json', 204)
        self.wfile.write(b'')

    def send_static_file(self, file_path):
        if not os.path.exists(file_path) or not file_path.startswith(STATIC_DIR):
            self.send_error(404)
            return
        content_type, _ = mimetypes.guess_type(file_path)
        if content_type is None:
            content_type = 'application/octet-stream'
        self._set_headers(content_type, 200)
        with open(file_path, 'rb') as f:
            self.wfile.write(f.read())

    def parse_json_body(self):
        length = int(self.headers.get('Content-Length', 0))
        raw_body = self.rfile.read(length) if length else b''
        try:
            return json.loads(raw_body.decode('utf-8') or '{}')
        except json.JSONDecodeError:
            return {}

    def do_GET(self):
        parsed_url = urllib.parse.urlparse(self.path)
        if parsed_url.path.startswith('/api/'):
            self.handle_api_get(parsed_url)
            return

        path = parsed_url.path if parsed_url.path != '/' else '/index.html'
        path = os.path.normpath(path.lstrip('/'))
        file_path = os.path.join(STATIC_DIR, path)
        self.send_static_file(file_path)

    def do_POST(self):
        parsed_url = urllib.parse.urlparse(self.path)
        if parsed_url.path.startswith('/api/'):
            self.handle_api_post(parsed_url)
            return
        self.send_error(404)

    def handle_api_get(self, parsed_url):
        if parsed_url.path in ('/api/hrdata', '/api/dashboard'):
            query = urllib.parse.parse_qs(parsed_url.query)
            email = query.get('email', [None])[0]
            if not email:
                self.send_json({'message': 'Email query is required.'}, status=400)
                return
            user = find_user_by_email(email)
            if not user:
                self.send_json({'message': 'User not found.'}, status=404)
                return
            employees = fetch_employee_rows(user['id'])
            latest = fetch_recent_prediction(user['id'])
            counts = calculate_counts(employees)
            self.send_json({
                'user': {'name': user['name'], 'email': user['email']},
                'employees': employees,
                'counts': counts,
                'latestPrediction': latest,
                'timestamp': datetime.datetime.utcnow().isoformat(),
            })
            return
        self.send_json({'message': 'Unknown API endpoint.'}, status=404)

    def handle_api_post(self, parsed_url):
        if parsed_url.path == '/api/signup':
            body = self.parse_json_body()
            name = body.get('name', '').strip()
            email = body.get('email', '').strip().lower()
            password = body.get('password', '')
            if not name or not email or not password:
                self.send_json({'message': 'Name, email, and password are required.'}, status=400)
                return
            if find_user_by_email(email):
                self.send_json({'message': 'This email is already registered.'}, status=409)
                return
            user = create_user(name, email, password)
            self.send_json({'message': 'Registration succeeded.', 'user': user}, status=201)
            return

        if parsed_url.path == '/api/prediction':
            body = self.parse_json_body()
            email = body.get('email', '').strip().lower()
            if not email:
                self.send_json({'message': 'Email is required.'}, status=400)
                return
            user = find_user_by_email(email)
            if not user:
                self.send_json({'message': 'User not found.'}, status=404)
                return
            risk = body.get('risk', '').strip()
            probability = body.get('probability')
            factors_list = body.get('factors_list', [])
            if not risk or probability is None:
                self.send_json({'message': 'Prediction outcome is required.'}, status=400)
                return
            factors_json = json.dumps(factors_list) if isinstance(factors_list, list) else json.dumps([])
            create_prediction(user['id'], risk, float(probability), factors_json, body)
            latest = fetch_recent_prediction(user['id'])
            employees = fetch_employee_rows(user['id'])
            counts = calculate_counts(employees)
            self.send_json({
                'message': 'Prediction saved.',
                'latestPrediction': latest,
                'counts': counts,
                'employees': employees,
            })
            return

        if parsed_url.path == '/api/login':
            body = self.parse_json_body()
            email = body.get('email', '').strip().lower()
            password = body.get('password', '')
            if not email or not password:
                self.send_json({'message': 'Email and password are required.'}, status=400)
                return
            user = find_user_by_email(email)
            if not user or user['password_hash'] != hash_password(password):
                self.send_json({'message': 'Invalid email or password.'}, status=401)
                return
            self.send_json({'message': 'Login successful.', 'user': {'name': user['name'], 'email': user['email']}})
            return

        self.send_json({'message': 'Unknown API endpoint.'}, status=404)


class ThreadedHTTPServer(ThreadingMixIn, HTTPServer):
    daemon_threads = True


def run(server_class=ThreadedHTTPServer, handler_class=WAISHandler, port=8000):
    init_db()
    server_address = ('', port)
    httpd = server_class(server_address, handler_class)
    print(f'Serving WAIS on http://localhost:{port}')
    httpd.serve_forever()


if __name__ == '__main__':
    run()
