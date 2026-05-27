-- HR Attrition SQL Module
-- Use this script to create the table and query attrition insights.

-- 1. Create the employee attrition table
CREATE TABLE employee_attrition (
    EmployeeID INT PRIMARY KEY,
    Age INT,
    BusinessTravel VARCHAR(50),
    DailyRate INT,
    Department VARCHAR(50),
    DistanceFromHome INT,
    Education INT,
    EducationField VARCHAR(100),
    EnvironmentSatisfaction INT,
    Gender VARCHAR(10),
    JobInvolvement INT,
    JobLevel INT,
    JobRole VARCHAR(100),
    JobSatisfaction INT,
    MaritalStatus VARCHAR(50),
    MonthlyIncome INT,
    NumCompaniesWorked INT,
    OverTime VARCHAR(5),
    PercentSalaryHike INT,
    PerformanceRating INT,
    RelationshipSatisfaction INT,
    StockOptionLevel INT,
    TotalWorkingYears INT,
    TrainingTimesLastYear INT,
    WorkLifeBalance INT,
    YearsAtCompany INT,
    YearsInCurrentRole INT,
    YearsSinceLastPromotion INT,
    YearsWithCurrManager INT,
    Attrition VARCHAR(3) CHECK (Attrition IN ('Yes','No'))
);

-- 2. Load data from CSV (example for SQL Server or PostgreSQL/Bulk Insert)
-- SQL Server example:
-- BULK INSERT employee_attrition
-- FROM 'C:\path\to\data\HR_Employee_Attrition.csv'
-- WITH (FIRSTROW = 2, FIELDTERMINATOR = ',', ROWTERMINATOR = '\n');

-- 3. Department-wise attrition
SELECT
    Department,
    COUNT(*) AS TotalEmployees,
    SUM(CASE WHEN Attrition = 'Yes' THEN 1 ELSE 0 END) AS AttritionCount,
    ROUND(100.0 * SUM(CASE WHEN Attrition = 'Yes' THEN 1 ELSE 0 END) / COUNT(*), 2) AS AttritionRate
FROM employee_attrition
GROUP BY Department
ORDER BY AttritionRate DESC;

-- 4. Job-role-wise attrition
SELECT
    JobRole,
    COUNT(*) AS TotalEmployees,
    SUM(CASE WHEN Attrition = 'Yes' THEN 1 ELSE 0 END) AS AttritionCount,
    ROUND(100.0 * SUM(CASE WHEN Attrition = 'Yes' THEN 1 ELSE 0 END) / COUNT(*), 2) AS AttritionRate
FROM employee_attrition
GROUP BY JobRole
ORDER BY AttritionRate DESC;

-- 5. Overtime vs attrition
SELECT
    OverTime,
    COUNT(*) AS TotalEmployees,
    SUM(CASE WHEN Attrition = 'Yes' THEN 1 ELSE 0 END) AS AttritionCount,
    ROUND(100.0 * SUM(CASE WHEN Attrition = 'Yes' THEN 1 ELSE 0 END) / COUNT(*), 2) AS AttritionRate
FROM employee_attrition
GROUP BY OverTime
ORDER BY AttritionRate DESC;

-- 6. Average income by attrition
SELECT
    Attrition,
    ROUND(AVG(MonthlyIncome), 2) AS AverageMonthlyIncome
FROM employee_attrition
GROUP BY Attrition;

-- 7. High-risk employee segments
SELECT
    Department,
    JobRole,
    OverTime,
    JobSatisfaction,
    WorkLifeBalance,
    COUNT(*) AS CountEmployees,
    ROUND(100.0 * SUM(CASE WHEN Attrition = 'Yes' THEN 1 ELSE 0 END) / COUNT(*), 2) AS AttritionRate
FROM employee_attrition
WHERE OverTime = 'Yes' AND JobSatisfaction <= 2 AND WorkLifeBalance <= 2
GROUP BY Department, JobRole, OverTime, JobSatisfaction, WorkLifeBalance
ORDER BY AttritionRate DESC, CountEmployees DESC;

-- 8. Attrition by job satisfaction
SELECT
    JobSatisfaction,
    COUNT(*) AS TotalEmployees,
    SUM(CASE WHEN Attrition = 'Yes' THEN 1 ELSE 0 END) AS AttritionCount,
    ROUND(100.0 * SUM(CASE WHEN Attrition = 'Yes' THEN 1 ELSE 0 END) / COUNT(*), 2) AS AttritionRate
FROM employee_attrition
GROUP BY JobSatisfaction
ORDER BY JobSatisfaction;
