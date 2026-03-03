import math
import os
import csv
import pandas as pd

# Config
INPUT_FILE = "Full CW Speaker List.xlsx"      # path to your Excel file
SHEET_NAME = 0                                # 0 = first sheet, or use sheet name as string
ROWS_PER_FILE = 50                           # max rows per CSV
OUTPUT_PREFIX = "Full_CW_Speaker_List_part"   # base name for CSVs
COMPANY_COLUMN = "Company Name"               # column name that holds company names


def split_excel_to_csv():
    df = pd.read_excel(INPUT_FILE, sheet_name=SHEET_NAME)

    # Remove commas from data so we can use comma delimiter with no quotes/escaping
    df = df.replace(",", " ", regex=True)

    total_rows = len(df)
    if total_rows == 0:
        print("No rows found in the Excel sheet.")
        return

    num_parts = math.ceil(total_rows / ROWS_PER_FILE)
    print(f"Total rows: {total_rows}, splitting into {num_parts} file(s).")

    base_dir = os.path.dirname(os.path.abspath(INPUT_FILE))

    for i in range(num_parts):
        start = i * ROWS_PER_FILE
        end = min((i + 1) * ROWS_PER_FILE, total_rows)

        part_df = df.iloc[start:end]

        out_name = f"{OUTPUT_PREFIX}_{i + 1}.csv"
        out_path = os.path.join(base_dir, out_name)
        part_df.to_csv(out_path, index=False, sep=",", quoting=csv.QUOTE_NONE)

        print(f"Written rows {start + 1}-{end} to {out_path}")

    if COMPANY_COLUMN in df.columns:
        companies = (
            df[COMPANY_COLUMN]
            .dropna()
            .astype(str)
            .str.strip()
            .str.strip('"')
            .str.replace(",", " ", regex=False)
            .replace("", pd.NA)
            .dropna()
            .drop_duplicates()
            .sort_values()
        )

        companies_df = pd.DataFrame({COMPANY_COLUMN: companies})

        companies_path = os.path.join(base_dir, "unique_companies.csv")
        companies_df.to_csv(companies_path, index=False, sep=",", quoting=csv.QUOTE_NONE)

        print(f"Wrote {len(companies_df)} unique companies to {companies_path}")
    else:
        print(f"Column '{COMPANY_COLUMN}' not found in sheet; skipping unique companies CSV.")


if __name__ == "__main__":
    split_excel_to_csv()