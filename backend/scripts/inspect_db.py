import sqlite3
import os
import json

BASE = os.path.dirname(os.path.dirname(__file__))
DB_PATH = os.path.join(BASE, 'db.sqlite3')

if not os.path.exists(DB_PATH):
    print(f"Database not found at {DB_PATH}")
    raise SystemExit(1)

conn = sqlite3.connect(DB_PATH)
conn.row_factory = sqlite3.Row
cur = conn.cursor()

cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;")
tables = [r[0] for r in cur.fetchall()]

print(f"Found {len(tables)} tables in {DB_PATH}\n")

for table in tables:
    print('='*80)
    print(f"Table: {table}")
    try:
        cur.execute(f"SELECT COUNT(*) as c FROM '{table}'")
        count = cur.fetchone()['c']
    except Exception as e:
        print(f"  [error counting rows]: {e}")
        count = 'N/A'
    print(f"  Rows: {count}")

    # Columns
    try:
        cur.execute(f"PRAGMA table_info('{table}')")
        cols = [r['name'] for r in cur.fetchall()]
    except Exception as e:
        cols = []
    if cols:
        print(f"  Columns: {', '.join(cols)}")

    # Sample rows
    try:
        cur.execute(f"SELECT * FROM '{table}' LIMIT 5")
        rows = cur.fetchall()
        if rows:
            print("  Sample rows:")
            for r in rows:
                # Convert sqlite3.Row to dict and pretty-print (truncate long values)
                d = {k: (v if (v is None or (isinstance(v, (int, float, str)) and len(str(v))<=200)) else str(v)[:200] + '...') for k,v in dict(r).items()}
                print("   ", json.dumps(d, default=str, ensure_ascii=False))
        else:
            print("  (no rows)")
    except Exception as e:
        print(f"  [error selecting rows]: {e}")

print('\nDone.')
conn.close()
