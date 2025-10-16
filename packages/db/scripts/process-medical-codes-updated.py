#!/usr/bin/env python3
"""
Updated script to process medical codes from new file formats:
- ICD10: Text format (icd10cm_order_2026.txt)
- HCPCS: Excel format (HCPC2025_OCT_ANWEB_Transaction Report_v4.xlsx)
- CPT: Keep existing Excel processing logic
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

def determine_hcpcs_category(code):
    """Determine HCPCS Level II category based on first letter."""
    if not code or len(code) == 0:
        return 'Other'

    first_char = code.strip()[0].upper()
    category_mapping = {
        'A': 'Transportation Services, Medical and Surgical Supplies',
        'B': 'Enteral and Parenteral Therapy',
        'C': 'Outpatient PPS',
        'D': 'Dental Procedures',
        'E': 'Durable Medical Equipment',
        'G': 'Procedures/Professional Services (Temporary)',
        'H': 'Alcohol and Drug Abuse Treatment Services',
        'J': 'Drugs Administered Other Than Oral Method',
        'K': 'Temporary Codes',
        'L': 'Orthotic/Prosthetic Procedures',
        'M': 'Medical Services',
        'P': 'Pathology and Laboratory Services',
        'Q': 'Temporary Codes',
        'R': 'Diagnostic Radiology Services',
        'S': 'Temporary National Codes',
        'T': 'National T-Codes',
        'V': 'Vision Services',
    }

    return category_mapping.get(first_char, 'Other')

def process_icd10_txt_file(file_path):
    """Process ICD-10 text file and generate SQL INSERT statements."""
    print(f"Processing ICD-10 text file: {file_path}")

    if not Path(file_path).exists():
        print(f"File not found: {file_path}")
        return None, 0

    try:
        values = []
        processed_codes = set()

        with open(file_path, 'r', encoding='utf-8') as file:
            for line_num, line in enumerate(file, 1):
                if line_num % 1000 == 0:
                    print(f"  Processed {line_num} lines...")

                line = line.strip()
                if not line:
                    continue

                # Parse the fixed-width format
                # Format: order_number(5) + space + code(7) + space + hierarchy_level(1) + space + short_desc(65) + space + long_desc
                parts = line.split(None, 4)  # Split on whitespace, max 5 parts
                if len(parts) < 5:
                    continue

                order_num = parts[0]
                code = parts[1].strip()
                hierarchy_level = parts[2]
                short_desc = parts[3]
                long_desc = parts[4] if len(parts) > 4 else parts[3]

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

                # Clean descriptions
                short_desc_clean = clean_text(short_desc)[:100] if short_desc else ''
                long_desc_clean = clean_text(long_desc)[:1000] if long_desc else ''

                # Determine if this is a header code (hierarchy level 0)
                is_header = hierarchy_level == '0'

                values.append(f"""(
    '{code}',
    '{short_desc_clean}',
    '{long_desc_clean}',
    '{clean_text(chapter)[:100]}',
    '{clean_text(chapter_range)[:20]}',
    NULL,
    '{clean_text(category)[:50]}',
    'diagnosis',
    NULL,
    NULL,
    NULL,
    NULL,
    false,
    false,
    false,
    {str(is_billable).lower()},
    {str(is_header).lower()},
    {str(requires_additional_digit).lower()},
    0,
    NULL,
    true,
    '2026-01-01'::date,
    NULL
)""")

        if not values:
            return None, 0

        sql = f"""-- ICD-10 Code Master Data (2026)
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
    chapter = EXCLUDED.chapter,
    chapter_range = EXCLUDED.chapter_range,
    is_billable = EXCLUDED.is_billable,
    is_header = EXCLUDED.is_header,
    requires_additional_digit = EXCLUDED.requires_additional_digit,
    updated_at = NOW();
"""

        return sql, len(values)

    except Exception as e:
        print(f"Error processing ICD-10 text file: {e}")
        return None, 0

def process_hcpcs_file(file_path):
    """Process HCPCS Excel file and generate SQL INSERT statements."""
    print(f"Processing HCPCS file: {file_path}")

    if not Path(file_path).exists():
        print(f"File not found: {file_path}")
        return None, 0

    try:
        # Read the "Changes by HCPC" sheet as it has all the codes
        df = pd.read_excel(file_path, sheet_name='Changes by HCPC')
        print(f"Columns in HCPCS file: {list(df.columns)}")
        print(f"Shape: {df.shape}")

        values = []
        processed_codes = set()

        for idx, row in df.iterrows():
            if idx % 1000 == 0 and idx > 0:
                print(f"  Processed {idx} rows...")

            code = clean_text(row.get('HCPC', '')).strip()
            if not code or code in processed_codes:
                continue

            processed_codes.add(code)

            action_code = clean_text(row.get('ACTION CD', ''))
            short_desc = clean_text(row.get('SHORT DESCRIPTION', ''))[:100]
            long_desc = clean_text(row.get('LONG DESCRIPTION', ''))[:1000]

            # Determine category
            category = determine_hcpcs_category(code)

            # Determine if this is active (not discontinued)
            is_active = action_code != 'D'  # D = Discontinued

            values.append(f"""(
    '{code}',
    '{short_desc}',
    '{long_desc}',
    '{clean_text(category)[:100]}',
    '{action_code}',
    NULL,
    NULL,
    NULL,
    {str(is_active).lower()},
    '2025-01-01'::date,
    NULL
)""")

        if not values:
            return None, 0

        sql = f"""-- HCPCS Level II Code Master Data
INSERT INTO hcpcs_code_master (
    hcpcs_code,
    short_description,
    long_description,
    category,
    action_code,
    coverage_status,
    pricing_indicator,
    multiple_pricing_indicator,
    is_active,
    effective_date,
    termination_date
) VALUES
{','.join(values)}
ON CONFLICT (hcpcs_code) DO UPDATE SET
    short_description = EXCLUDED.short_description,
    long_description = EXCLUDED.long_description,
    category = EXCLUDED.category,
    action_code = EXCLUDED.action_code,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();
"""

        return sql, len(values)

    except Exception as e:
        print(f"Error processing HCPCS file: {e}")
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
    false,
    false,
    false,
    false,
    NULL,
    false,
    false,
    0,
    NULL,
    true,
    '2025-01-01'::date,
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
    bilateral_surgery,
    assistant_surgeon,
    co_surgeon,
    multiple_proc,
    global_period,
    prior_auth_commonly_required,
    modifier_51_exempt,
    usage_count,
    last_used_date,
    is_active,
    effective_date,
    termination_date
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
    """Main function to process all files."""
    print("=" * 60)
    print("Updated Medical Code Processing Script")
    print("=" * 60)
    print()

    # File paths - update these to match your downloaded files
    icd10_file = "/Users/michaeldadi/Downloads/icd10orderfiles/icd10cm_order_2026.txt"
    hcpcs_file = "/Users/michaeldadi/Downloads/hcpc2025_oct_anweb_v4/HCPC2025_OCT_ANWEB_Transaction Report_v4.xlsx"
    cpt_file = "/Users/michaeldadi/Downloads/2025_dhs_code_list_addendum_11_26_2024-2/2025_DHS_Code_List_Addendum_11_26_2024.xlsx"

    # Output file
    current_dir = Path(__file__).parent.parent
    output_file = current_dir / "populate_medical_codes_updated.sql"

    print(f"Output file: {output_file}")
    print()

    all_sql = []
    all_sql.append("-- Updated Medical Code Master Data Population")
    all_sql.append("-- Generated for current schema structure")
    all_sql.append("")

    total_icd10 = 0
    total_hcpcs = 0
    total_cpt = 0

    # Process ICD-10 codes
    if Path(icd10_file).exists():
        icd10_sql, icd10_count = process_icd10_txt_file(icd10_file)
        if icd10_sql:
            all_sql.append(icd10_sql)
            all_sql.append("")
            total_icd10 = icd10_count
            print(f"✓ Processed {icd10_count} ICD-10 codes")
        else:
            print("✗ Failed to process ICD-10 file")
    else:
        print(f"⚠ ICD-10 file not found: {icd10_file}")

    # Process HCPCS codes
    if Path(hcpcs_file).exists():
        hcpcs_sql, hcpcs_count = process_hcpcs_file(hcpcs_file)
        if hcpcs_sql:
            all_sql.append(hcpcs_sql)
            all_sql.append("")
            total_hcpcs = hcpcs_count
            print(f"✓ Processed {hcpcs_count} HCPCS codes")
        else:
            print("✗ Failed to process HCPCS file")
    else:
        print(f"⚠ HCPCS file not found: {hcpcs_file}")

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

    if total_icd10 == 0 and total_hcpcs == 0 and total_cpt == 0:
        print("\n❌ No codes were processed. Please check your file paths and formats.")
        return

    # Write to file
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write('\n'.join(all_sql))
        print(f"\n✅ SQL file generated: {output_file}")
        print(f"📊 Total ICD-10 codes: {total_icd10}")
        print(f"📊 Total HCPCS codes: {total_hcpcs}")
        print(f"📊 Total CPT codes: {total_cpt}")
        print()
        print("Next steps:")
        print("1. Review the generated SQL file")
        print("2. The HCPCS codes include a CREATE TABLE statement - you may need to add this to your schema")
        print("3. Run the SQL file against your database")
    except Exception as e:
        print(f"❌ Error writing file: {e}")

if __name__ == "__main__":
    main()
