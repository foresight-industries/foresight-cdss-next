#!/usr/bin/env python3
"""
Improved script to process XLSX files containing CPT and ICD-10 codes
and generate SQL INSERT statements compatible with the current schema.
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
    if len(text) > 1000:
        text = text[:1000]
    return text

def determine_icd10_properties(code):
    """Determine ICD-10 code properties based on structure."""
    # Billable determination
    is_billable = True
    if len(code) == 3:  # Category codes like A01
        is_billable = False
    elif len(code) == 4 and code.endswith('9'):  # Unspecified codes like A019
        is_billable = False
    elif 'X' in code:  # Placeholder codes
        is_billable = False

    # 7th character requirement
    requires_additional_digit = False
    if code.startswith(('S', 'T')) and len(code) >= 6:
        requires_additional_digit = True
    elif code.startswith(('M80', 'M84', 'M48.4', 'M48.5')):
        requires_additional_digit = True

    return is_billable, requires_additional_digit

def determine_icd10_chapter_info(code):
    """Determine ICD-10 chapter and category information."""
    chapter_mapping = {
        'A': ('Infectious and parasitic diseases', 'A00-B99'),
        'B': ('Infectious and parasitic diseases', 'A00-B99'),
        'C': ('Neoplasms', 'C00-D49'),
        'D': ('Diseases of blood and immune system', 'D50-D89'),
        'E': ('Endocrine, nutritional and metabolic diseases', 'E00-E89'),
        'F': ('Mental and behavioral disorders', 'F01-F99'),
        'G': ('Diseases of the nervous system', 'G00-G99'),
        'H': ('Diseases of eye/ear and adnexa', 'H00-H95'),
        'I': ('Diseases of the circulatory system', 'I00-I99'),
        'J': ('Diseases of the respiratory system', 'J00-J99'),
        'K': ('Diseases of the digestive system', 'K00-K95'),
        'L': ('Diseases of skin and subcutaneous tissue', 'L00-L99'),
        'M': ('Diseases of musculoskeletal system', 'M00-M99'),
        'N': ('Diseases of the genitourinary system', 'N00-N99'),
        'O': ('Pregnancy, childbirth and the puerperium', 'O00-O9A'),
        'P': ('Perinatal conditions', 'P00-P96'),
        'Q': ('Congenital malformations', 'Q00-Q99'),
        'R': ('Symptoms, signs and abnormal findings', 'R00-R99'),
        'S': ('Injury, poisoning (by body region)', 'S00-T88'),
        'T': ('Injury, poisoning (by type)', 'S00-T88'),
        'V': ('External causes - transport accidents', 'V00-Y99'),
        'W': ('External causes - other accidents', 'V00-Y99'),
        'X': ('External causes - intentional self-harm', 'V00-Y99'),
        'Y': ('External causes - assault, undetermined', 'V00-Y99'),
        'Z': ('Factors influencing health status', 'Z00-Z99')
    }

    chapter_info = chapter_mapping.get(code[0], ('Other', 'Unknown'))
    return chapter_info[0], chapter_info[1]

def determine_cpt_category(code, current_category=''):
    """Determine CPT category based on code range."""
    try:
        code_num = int(code)
        if 99201 <= code_num <= 99499:
            return 'Evaluation and Management'
        elif 10021 <= code_num <= 69990:
            return 'Surgery'
        elif 70010 <= code_num <= 79999:
            return 'Radiology'
        elif 80047 <= code_num <= 89398:
            return 'Pathology and Laboratory'
        elif 90281 <= code_num <= 99199:
            return 'Medicine'
        elif 99500 <= code_num <= 99607:
            return 'Home Health Procedures/Services'
        else:
            return current_category or 'Other'
    except ValueError:
        return current_category or 'Other'

def process_icd10_file(file_path):
    """Process ICD-10 XLSX file and generate SQL INSERT statements."""
    print(f"Processing ICD-10 file: {file_path}")

    if not Path(file_path).exists():
        print(f"File not found: {file_path}")
        return None, 0

    try:
        # Read the Excel file
        df = pd.read_excel(file_path)
        print(f"Columns in ICD-10 file: {list(df.columns)}")
        print(f"Shape: {df.shape}")

        # Auto-detect column names
        code_col = None
        desc_col = None

        for col in df.columns:
            col_lower = str(col).lower()
            if 'code' in col_lower and code_col is None:
                code_col = col
            elif any(word in col_lower for word in ['description', 'desc']) and desc_col is None:
                desc_col = col

        if not code_col:
            print("Could not find code column. Using first column.")
            code_col = df.columns[0]

        if not desc_col:
            print("Could not find description column. Using second column.")
            desc_col = df.columns[1] if len(df.columns) > 1 else code_col

        print(f"Using code column: {code_col}")
        print(f"Using description column: {desc_col}")

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

            # Validate ICD-10 format
            if not re.match(r'^[A-Z]\d{2}', code):
                continue

            # Determine properties
            is_billable, requires_additional_digit = determine_icd10_properties(code)
            chapter, chapter_range = determine_icd10_chapter_info(code)

            # Generate category (first 3 characters)
            category = code[:3]

            # Truncate descriptions to fit schema limits
            short_desc = description[:100] if description else ''
            long_desc = description[:1000] if description else ''

            values.append(f"""(
    '{code}',
    '{short_desc}',
    '{long_desc}',
    '{chapter[:100]}',
    '{chapter_range[:20]}',
    NULL,
    '{category[:50]}',
    'diagnosis',
    NULL,
    NULL,
    NULL,
    NULL,
    false,
    false,
    false,
    {str(is_billable).lower()},
    false,
    {str(requires_additional_digit).lower()},
    0,
    NULL,
    true,
    '2025-01-01'::date,
    NULL
)""")

        if not values:
            return None, 0

        sql = f"""-- ICD-10 Code Master Data
INSERT INTO icd10_code_master (
    icd10_code,
    short_description,
    long_description,
    chapter,
    chapter_range,
    section,
    category,
    code_type,
    laterality,
    encounter,
    age_group,
    gender,
    reporting_required,
    public_health_reporting,
    manifestation_code,
    is_billable,
    is_header,
    requires_additional_digit,
    usage_count,
    last_used_date,
    is_active,
    effective_date,
    termination_date
) VALUES
{','.join(values)}
ON CONFLICT (icd10_code) DO UPDATE SET
    short_description = EXCLUDED.short_description,
    long_description = EXCLUDED.long_description,
    updated_at = NOW();
"""

        return sql, len(values)

    except Exception as e:
        print(f"Error processing ICD-10 file: {e}")
        return None, 0

def process_cpt_file(file_path):
    """Process CPT XLSX file and generate SQL INSERT statements."""
    print(f"Processing CPT file: {file_path}")

    if not Path(file_path).exists():
        print(f"File not found: {file_path}")
        return None, 0

    try:
        df = pd.read_excel(file_path)
        print(f"Columns in CPT file: {list(df.columns)}")
        print(f"Shape: {df.shape}")

        # Auto-detect columns
        code_col = df.columns[0]  # First column usually contains codes
        desc_col = df.columns[1] if len(df.columns) > 1 else df.columns[0]

        values = []
        processed_codes = set()
        current_category = ''

        for idx, row in df.iterrows():
            col_0_val = str(row.get(code_col, '')).strip()
            col_1_val = str(row.get(desc_col, '')).strip() if not pd.isna(row.get(desc_col)) else ''

            # Skip empty rows
            if not col_0_val or col_0_val == 'nan':
                continue

            # Check if this row is a category header
            if ('SERVICES' in col_0_val.upper() or
                (col_0_val.isupper() and len(col_0_val.split()) > 1 and
                 not re.match(r'^\d{5}$', col_0_val))):
                current_category = col_0_val
                continue

            # Check if this is a CPT code (5 digits)
            if re.match(r'^\d{5}$', col_0_val):
                code = col_0_val
                description = col_1_val if col_1_val and col_1_val != 'nan' else ''

                # Skip if already processed
                if code in processed_codes:
                    continue
                processed_codes.add(code)

                # Determine category
                category = determine_cpt_category(code, current_category)

                # Clean for SQL
                clean_desc = clean_text(description)
                clean_cat = clean_text(category)

                # Truncate to fit schema
                short_desc = clean_desc[:100] if clean_desc else ''
                long_desc = clean_desc[:1000] if clean_desc else ''
                cat_limited = clean_cat[:50] if clean_cat else ''

                values.append(f"""(
    '{code}',
    '{short_desc}',
    '{long_desc}',
    '{cat_limited}',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    true,
    false,
    true,
    false,
    NULL,
    NULL,
    '2025-01-01'::date,
    NULL,
    0,
    NULL
)""")

        if not values:
            return None, 0

        sql = f"""-- CPT Code Master Data
INSERT INTO cpt_code_master (
    cpt_code,
    short_description,
    long_description,
    category,
    section,
    subsection,
    rvu_work,
    rvu_practice_expense,
    rvu_malpractice,
    rvu_total,
    global_period,
    is_active,
    requires_modifier,
    is_billable,
    prior_auth_commonly_required,
    age_restrictions,
    gender_restrictions,
    effective_date,
    termination_date,
    usage_count,
    last_used_date
) VALUES
{','.join(values)}
ON CONFLICT (cpt_code) DO UPDATE SET
    short_description = EXCLUDED.short_description,
    long_description = EXCLUDED.long_description,
    updated_at = NOW();
"""

        return sql, len(values)

    except Exception as e:
        print(f"Error processing CPT file: {e}")
        return None, 0

def main():
    """Main function to process both files."""
    # Generate a UUID for organization (user will need to replace this)
    org_id = str(uuid.uuid4())

    print("=" * 60)
    print("Medical Code Processing Script")
    print("=" * 60)
    print()
    print("IMPORTANT: This script generates SQL with a random organization_id.")
    print(f"Generated org ID: {org_id}")
    print("You'll need to replace this with your actual organization ID before running the SQL.")
    print()

    # File paths - update these to match your downloaded files
    icd10_file = "/Users/michaeldadi/Downloads/section111validicd10-jan2025_0.xlsx"
    cpt_file = "/Users/michaeldadi/Downloads/2025_dhs_code_list_addendum_11_26_2024-2/2025_DHS_Code_List_Addendum_11_26_2024.xlsx"

    # Output file
    current_dir = Path(__file__).parent.parent
    output_file = current_dir / "populate_medical_codes_schema_compatible.sql"

    print(f"Output file: {output_file}")
    print()

    all_sql = []
    all_sql.append("-- Medical Code Master Data Population")
    all_sql.append("-- Generated for current schema structure")
    all_sql.append("-- IMPORTANT: Replace the organization_id with your actual organization UUID")
    all_sql.append("")
    all_sql.append("-- First, create an organization if it doesn't exist:")
    all_sql.append(f"-- INSERT INTO organizations (id, name) VALUES ('{org_id}', 'Default Organization') ON CONFLICT DO NOTHING;")
    all_sql.append("")

    total_icd10 = 0
    total_cpt = 0

    # Process ICD-10 codes
    if Path(icd10_file).exists():
        icd10_sql, icd10_count = process_icd10_file(icd10_file)
        if icd10_sql:
            all_sql.append(icd10_sql)
            all_sql.append("")
            total_icd10 = icd10_count
            print(f"✓ Processed {icd10_count} ICD-10 codes")
        else:
            print("✗ Failed to process ICD-10 file")
    else:
        print(f"⚠ ICD-10 file not found: {icd10_file}")

    # Process CPT codes
    if Path(cpt_file).exists():
        cpt_sql, cpt_count = process_cpt_file(cpt_file)
        if cpt_sql:
            all_sql.append(cpt_sql)
            total_cpt = cpt_count
            print(f"✓ Processed {cpt_count} CPT codes")
        else:
            print("✗ Failed to process CPT file")
    else:
        print(f"⚠ CPT file not found: {cpt_file}")

    if total_icd10 == 0 and total_cpt == 0:
        print("\n❌ No codes were processed. Please check your file paths and formats.")
        return

    # Write to file
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write('\n'.join(all_sql))
        print(f"\n✅ SQL file generated: {output_file}")
        print(f"📊 Total ICD-10 codes: {total_icd10}")
        print(f"📊 Total CPT codes: {total_cpt}")
        print()
        print("Next steps:")
        print("1. Replace the organization_id in the SQL file with your actual organization UUID")
        print("2. Run: cd packages/db && yarn db:populate-codes")
        print("   or execute the SQL file directly against your database")
    except Exception as e:
        print(f"❌ Error writing file: {e}")

if __name__ == "__main__":
    main()
