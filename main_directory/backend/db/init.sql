-- Initialize mf_db with tables and sample data for MACHARIA'S FARMHOUSE
USE mf_db;

-- Pigs table: basic inventory
CREATE TABLE IF NOT EXISTS pigs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  breed VARCHAR(100),
  weight DECIMAL(6,2),
  age INT,
  date_added TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sales: records of sales (for business analytics)
CREATE TABLE IF NOT EXISTS sales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pig_id INT,
  sale_date DATE,
  price DECIMAL(10,2),
  buyer VARCHAR(200),
  FOREIGN KEY (pig_id) REFERENCES pigs(id) ON DELETE SET NULL
);

-- Inventory: feed/medicine stocks
CREATE TABLE IF NOT EXISTS inventory (
  id INT AUTO_INCREMENT PRIMARY KEY,
  item VARCHAR(200) NOT NULL,
  quantity INT DEFAULT 0,
  unit VARCHAR(32),
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Employees: basic staff list
CREATE TABLE IF NOT EXISTS employees (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  role VARCHAR(100),
  hired DATE
);

-- Health records for pigs
CREATE TABLE IF NOT EXISTS health_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pig_id INT,
  check_date DATE,
  notes TEXT,
  vet VARCHAR(200),
  FOREIGN KEY (pig_id) REFERENCES pigs(id) ON DELETE CASCADE
);

-- Sample data for testing
INSERT INTO pigs (name, breed, weight, age) VALUES
  ('Bacon', 'Large White', 120.50, 18),
  ('Rosie', 'Tamworth', 85.20, 12),
  ('Porky', 'Berkshire', 95.00, 14);

INSERT INTO inventory (item, quantity, unit) VALUES
  ('Feed - Starter', 200, 'kg'),
  ('Antibiotic A', 50, 'bottles');

INSERT INTO employees (name, role, hired) VALUES
  ('Macharia', 'Owner', '2018-03-01'),
  ('Jane Doe', 'Farmhand', '2022-06-15');

INSERT INTO sales (pig_id, sale_date, price, buyer) VALUES
  (1, CURDATE() - INTERVAL 30 DAY, 250.00, 'Local Butcher Co.' ),
  (2, CURDATE() - INTERVAL 10 DAY, 180.00, 'Farmer Joe');

INSERT INTO health_records (pig_id, check_date, notes, vet) VALUES
  (1, CURDATE() - INTERVAL 20 DAY, 'Vaccinated, healthy', 'Dr. K.'),
  (3, CURDATE() - INTERVAL 5 DAY, 'Minor injury treated', 'Dr. L.');
