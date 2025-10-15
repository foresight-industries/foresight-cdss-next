#!/usr/bin/env python3
"""
Script to process XLSX file containing CARC and RARC codes
and generate SQL INSERT statements for the adjustment_reason_code table.
"""

import pandas as pd
import re
import sys
import uuid
from pathlib import Path

def clean_text(text):
    """Clean and sanitize text for SQL insertion."""
    if pd.isna(text):
        return None
    text = str(text).strip()
    # Escape single quotes for SQL
    text = text.replace("'", "''")
    # Limit length to prevent issues
    if len(text) > 2000:
        text = text[:2000]
    return text

def determine_category(code_type, description):
    """Determine the category based on code type and description."""
    desc_lower = description.lower() if description else ''
    
    # Map keywords to categories
    if any(word in desc_lower for word in ['patient', 'deductible', 'copay', 'coinsurance']):
        return 'Patient Responsibility'
    elif any(word in desc_lower for word in ['coverage', 'benefit', 'covered']):
        return 'Coverage'
    elif any(word in desc_lower for word in ['medical necessity', 'medically necessary']):
        return 'Medical Necessity'
    elif any(word in desc_lower for word in ['limit', 'maximum', 'exceeded']):
        return 'Benefit Limit'
    elif any(word in desc_lower for word in ['administrative', 'processing', 'clerical']):
        return 'Administrative'
    elif any(word in desc_lower for word in ['duplicate', 'previously paid']):
        return 'Duplicate'
    elif any(word in desc_lower for word in ['authorization', 'prior auth']):
        return 'Authorization'
    elif any(word in desc_lower for word in ['coordination', 'other insurance', 'cob']):
        return 'COB'
    elif any(word in desc_lower for word in ['contractual', 'contract', 'allowable']):
        return 'Contractual'
    elif any(word in desc_lower for word in ['documentation', 'records', 'missing']):
        return 'Documentation'
    elif any(word in desc_lower for word in ['eligibility', 'eligible']):
        return 'Eligibility'
    elif any(word in desc_lower for word in ['timely filing', 'claim filing', 'late']):
        return 'Timely Filing'
    elif any(word in desc_lower for word in ['coding', 'procedure code', 'diagnosis']):
        return 'Coding Error'
    elif any(word in desc_lower for word in ['bundling', 'bundled', 'inclusive']):
        return 'Bundling'
    elif any(word in desc_lower for word in ['appeal', 'review']):
        return 'Appeal Rights'
    elif any(word in desc_lower for word in ['routing', 'forward']):
        return 'Routing'
    else:
        return 'Administrative'  # Default category

def determine_financial_class(code_type, description):
    """Determine financial class based on description."""
    desc_lower = description.lower() if description else ''
    
    if any(word in desc_lower for word in ['patient', 'deductible', 'copay', 'coinsurance']):
        return 'patient_responsibility'
    elif any(word in desc_lower for word in ['contractual', 'allowable', 'contract']):
        return 'contractual'
    elif any(word in desc_lower for word in ['write', 'adjustment', 'non-covered']):
        return 'adjustment'
    else:
        return 'other'

def determine_appealable(description):
    """Determine if the adjustment reason is appealable."""
    desc_lower = description.lower() if description else ''
    
    # Non-appealable conditions
    if any(word in desc_lower for word in ['duplicate', 'timely filing', 'late', 'administrative']):
        return False
    # Appealable conditions
    elif any(word in desc_lower for word in ['medical necessity', 'coverage', 'denial', 'benefit']):
        return True
    else:
        return False  # Default to not appealable

def process_carc_rarc_file(file_path):
    """Process CARC/RARC XLSX file and generate SQL INSERT statements."""
    print(f"Processing CARC/RARC file: {file_path}")

    if not Path(file_path).exists():
        print(f"File not found: {file_path}")
        return None, 0

    try:
        # Read the Excel file - try different sheet names
        df = None
        sheet_names_to_try = [0, 'Sheet1', 'CARC-RARC', 'Codes', 'Data']
        
        for sheet in sheet_names_to_try:
            try:
                df = pd.read_excel(file_path, sheet_name=sheet)
                print(f"Successfully read sheet: {sheet}")
                break
            except:
                continue
        
        if df is None:
            print("Could not read any sheet from the Excel file")
            return None, 0
            
        print(f"Columns in file: {list(df.columns)}")
        print(f"Shape: {df.shape}")
        print(f"First few rows:")
        print(df.head())

        # Auto-detect column names
        code_col = None
        desc_col = None
        type_col = None

        for col in df.columns:
            col_lower = str(col).lower()
            if any(word in col_lower for word in ['code', 'number']) and code_col is None:
                code_col = col
            elif any(word in col_lower for word in ['description', 'desc', 'reason']) and desc_col is None:
                desc_col = col
            elif any(word in col_lower for word in ['type', 'carc', 'rarc']) and type_col is None:
                type_col = col

        # If we can't auto-detect, use positional
        if not code_col:
            code_col = df.columns[0]
        if not desc_col:
            desc_col = df.columns[1] if len(df.columns) > 1 else df.columns[0]

        print(f"Using code column: {code_col}")
        print(f"Using description column: {desc_col}")
        print(f"Using type column: {type_col}")

        values = []
        processed_codes = set()

        for idx, row in df.iterrows():
            if pd.isna(row.get(code_col)):
                continue

            code = clean_text(row[code_col])
            description = clean_text(row.get(desc_col, '')) or ''
            
            # Skip if we've already processed this code
            if code in processed_codes:
                continue
            processed_codes.add(code)

            # Determine code type (CARC or RARC)
            if type_col and not pd.isna(row.get(type_col)):
                code_type_raw = str(row[type_col]).strip().upper()
                if 'CARC' in code_type_raw:
                    code_type = 'CARC'
                elif 'RARC' in code_type_raw:
                    code_type = 'RARC'
                else:
                    # Try to determine from code pattern
                    if code.startswith(('CO', 'OA', 'PI', 'PR')):
                        code_type = 'CARC'
                    elif code.startswith(('N', 'M', 'A')):
                        code_type = 'RARC'
                    else:
                        print(f"Warning: Could not determine type for code {code}, defaulting to CARC")
                        code_type = 'CARC'
            else:
                # Determine from code pattern or position in file
                if code.startswith(('CO', 'OA', 'PI', 'PR')) or (code.isdigit() and int(code) < 300):
                    code_type = 'CARC'
                else:
                    code_type = 'RARC'

            # Determine other fields
            category = determine_category(code_type, description)
            financial_class = determine_financial_class(code_type, description)
            appealable = determine_appealable(description)
            
            # Truncate descriptions to fit schema limits
            short_desc = description[:100] if description else ''
            
            # Determine if patient notification is required
            requires_notification = 'patient' in description.lower() if description else False

            values.append(f"""(
    '{code}',
    '{code_type}',
    '{category}',
    '{description}',
    '{short_desc}',
    NULL,
    NULL,
    '{financial_class}',
    {str(requires_notification).lower()},
    {str(appealable).lower()},
    true,
    '2025-01-01'::date,
    NULL
)""")

        if not values:
            return None, 0

        sql = f"""-- CARC/RARC Adjustment Reason Code Data
INSERT INTO adjustment_reason_code (
    code,
    code_type,
    category,
    description,
    short_description,
    payer_id,
    payer_specific_code,
    financial_class,
    requires_patient_notification,
    appealable,
    is_active,
    effective_date,
    expiration_date
) VALUES
{','.join(values)}
ON CONFLICT (code, code_type) DO UPDATE SET
    description = EXCLUDED.description,
    short_description = EXCLUDED.short_description,
    category = EXCLUDED.category,
    financial_class = EXCLUDED.financial_class,
    requires_patient_notification = EXCLUDED.requires_patient_notification,
    appealable = EXCLUDED.appealable,
    updated_at = NOW();
"""

        return sql, len(values)

    except Exception as e:
        print(f"Error processing CARC/RARC file: {e}")
        import traceback
        traceback.print_exc()
        return None, 0

def main():
    """Main function to process the file."""
    print("=" * 60)
    print("CARC/RARC Code Processing Script")
    print("=" * 60)
    print()

    # File path
    carc_rarc_file = "/Users/michaeldadi/Downloads/CARC-RARC-Full-List-04-18-2025%20CY25-2%20release_0_0.xlsx"

    # Output file
    current_dir = Path(__file__).parent.parent
    output_file = current_dir / "populate_carc_rarc_codes.sql"

    print(f"Input file: {carc_rarc_file}")
    print(f"Output file: {output_file}")
    print()

    # Process CARC/RARC codes
    if Path(carc_rarc_file).exists():
        carc_rarc_sql, count = process_carc_rarc_file(carc_rarc_file)
        if carc_rarc_sql:
            # Write to file
            try:
                with open(output_file, 'w', encoding='utf-8') as f:
                    f.write("-- CARC/RARC Adjustment Reason Code Data Population\n")
                    f.write("-- Generated for adjustment_reason_code table\n\n")
                    f.write(carc_rarc_sql)
                    
                print(f"\n✅ SQL file generated: {output_file}")
                print(f"📊 Total codes processed: {count}")
                print()
                print("Next steps:")
                print("1. Review the generated SQL file")
                print("2. Run: cd packages/db && yarn populate-carc-rarc")
                print("   or execute the SQL file directly against your database")
            except Exception as e:
                print(f"❌ Error writing file: {e}")
        else:
            print("✗ Failed to process CARC/RARC file")
    else:
        print(f"⚠ CARC/RARC file not found: {carc_rarc_file}")

if __name__ == "__main__":
    main()