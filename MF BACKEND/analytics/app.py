from flask import Flask, jsonify, send_file, request
import pandas as pd
import mysql.connector
import io
import os

app = Flask(__name__)


def get_db_conn():
    return mysql.connector.connect(
        host=os.environ.get('MYSQL_HOST', 'mysql'),
        user=os.environ.get('MYSQL_USER', 'root'),
        password=os.environ.get('MYSQL_PASSWORD', 'example'),
        database=os.environ.get('MYSQL_DATABASE', 'mf_db'),
    )


@app.route('/analytics/summary')
def summary():
    # Example: read a 'pigs' table and provide simple aggregations
    conn = get_db_conn()
    try:
        df = pd.read_sql('SELECT * FROM pigs LIMIT 1000', conn)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

    if df.empty:
        return jsonify({'message': 'no data', 'rows': 0})

    summary = {
        'rows': len(df),
        'weight_mean': df['weight'].mean() if 'weight' in df.columns else None,
        'age_mean': df['age'].mean() if 'age' in df.columns else None,
    }
    return jsonify(summary)


@app.route('/analytics/csv')
def csv_download():
    conn = get_db_conn()
    try:
        df = pd.read_sql('SELECT * FROM pigs', conn)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

    buf = io.StringIO()
    df.to_csv(buf, index=False)
    buf.seek(0)
    return send_file(io.BytesIO(buf.getvalue().encode('utf-8')), mimetype='text/csv', as_attachment=True, download_name='pigs.csv')


@app.route('/analytics/tableau_metadata')
def tableau_metadata():
    """Return simple metadata about the pigs table for Tableau (column names + types)."""
    conn = get_db_conn()
    try:
        df = pd.read_sql('SELECT * FROM pigs LIMIT 1', conn)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

    if df.empty:
        return jsonify({'columns': []})

    cols = []
    for c in df.columns:
        dtype = str(df[c].dtype)
        cols.append({'name': c, 'dtype': dtype})
    return jsonify({'columns': cols, 'example_rows': min(5, len(df))})


@app.route('/analytics/tableau')
def tableau_download():
    """Convenience endpoint returning CSV suitable for Tableau import (same as /analytics/csv)."""
    # Reuse csv_download logic for now
    return csv_download()


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)
