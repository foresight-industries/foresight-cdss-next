#!/usr/bin/env python3
"""
Script to analyze the HCPCS Transaction Report xlsx file structure
"""

import pandas as pd
from pathlib import Path

def analyze_hcpcs_file():
    file_path = "/Users/michaeldadi/Downloads/hcpc2025_oct_anweb_v4/HCPC2025_OCT_ANWEB_Transaction Report_v4.xlsx"
    
    if not Path(file_path).exists():
        print(f"File not found: {file_path}")
        return
    
    try:
        # Read the Excel file to get sheet names
        xl_file = pd.ExcelFile(file_path)
        print(f"Sheet names: {xl_file.sheet_names}")
        
        # Read each sheet and analyze structure
        for sheet_name in xl_file.sheet_names:
            print(f"\n=== Sheet: {sheet_name} ===")
            df = pd.read_excel(file_path, sheet_name=sheet_name)
            print(f"Shape: {df.shape}")
            print(f"Columns: {list(df.columns)}")
            
            # Show first few rows
            print("\nFirst 5 rows:")
            print(df.head())
            
            # Show data types
            print(f"\nData types:")
            print(df.dtypes)
            
            # Check for unique values in key columns
            if len(df.columns) > 0:
                first_col = df.columns[0]
                print(f"\nUnique values in first column ({first_col}): {df[first_col].nunique()}")
                print(f"Sample values: {df[first_col].dropna().head(10).tolist()}")
            
            print("\n" + "="*60)
    
    except Exception as e:
        print(f"Error analyzing file: {e}")

if __name__ == "__main__":
    analyze_hcpcs_file()