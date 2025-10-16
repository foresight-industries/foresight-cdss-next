#!/usr/bin/env tsx

import { drizzle } from 'drizzle-orm/aws-data-api/pg';
import { RDSDataClient } from '@aws-sdk/client-rds-data';
import { config } from '@dotenvx/dotenvx';
import { sql } from 'drizzle-orm';

function initializeDatabase() {
  // Re-read environment variables on each execution
  config({ path: './.env.local' });

  const client = new RDSDataClient({
    region: process.env.AWS_REGION || 'us-east-1',
  });

  if (
    !process.env.DATABASE_NAME ||
    !process.env.DATABASE_SECRET_ARN ||
    !process.env.DATABASE_CLUSTER_ARN
  ) {
    throw new Error('Missing required AWS RDS environment variables');
  }

  return drizzle(client, {
    database: process.env.DATABASE_NAME ?? 'rcm',
    secretArn: process.env.DATABASE_SECRET_ARN,
    resourceArn: process.env.DATABASE_CLUSTER_ARN,
  });
}

// Place of Service data
const posData = [
  { code: '01', name: 'Pharmacy', description: 'A facility or location where drugs and other medically related items and services are sold, dispensed, or otherwise provided directly to patients. (Effective October 1, 2003) (Revised, effective October 1, 2005)', effectiveDate: '2003-10-01' },
  { code: '02', name: 'Telehealth Provided Other than in Patient\'s Home', description: 'The location where health services and health related services are provided or received, through telecommunication technology. Patient is not located in their home when receiving health services or health related services through telecommunication technology. (Effective January 1, 2017) (Description change effective January 1, 2022, and applicable for Medicare April 1, 2022.)', effectiveDate: '2017-01-01' },
  { code: '03', name: 'School', description: 'A facility whose primary purpose is education. (Effective January 1, 2003)', effectiveDate: '2003-01-01' },
  { code: '04', name: 'Homeless Shelter', description: 'A facility or location whose primary purpose is to provide temporary housing to homeless individuals (e.g., emergency shelters, individual or family shelters). (Effective January 1, 2003)', effectiveDate: '2003-01-01' },
  { code: '05', name: 'Indian Health Service Free-standing Facility', description: 'A facility or location, owned and operated by the Indian Health Service, which provides diagnostic, therapeutic (surgical and non-surgical), and rehabilitation services to American Indians and Alaska Natives who do not require hospitalization. (Effective January 1, 2003)', effectiveDate: '2003-01-01' },
  { code: '06', name: 'Indian Health Service Provider-based Facility', description: 'A facility or location, owned and operated by the Indian Health Service, which provides diagnostic, therapeutic (surgical and non-surgical), and rehabilitation services rendered by, or under the supervision of, physicians to American Indians and Alaska Natives admitted as inpatients or outpatients. (Effective January 1, 2003)', effectiveDate: '2003-01-01' },
  { code: '07', name: 'Tribal 638 Free-standing Facility', description: 'A facility or location owned and operated by a federally recognized American Indian or Alaska Native tribe or tribal organization under a 638 agreement, which provides diagnostic, therapeutic (surgical and non-surgical), and rehabilitation services to tribal members who do not require hospitalization. (Effective January 1, 2003)', effectiveDate: '2003-01-01' },
  { code: '08', name: 'Tribal 638 Provider-based Facility', description: 'A facility or location owned and operated by a federally recognized American Indian or Alaska Native tribe or tribal organization under a 638 agreement, which provides diagnostic, therapeutic (surgical and non-surgical), and rehabilitation services to tribal members admitted as inpatients or outpatients. (Effective January 1, 2003)', effectiveDate: '2003-01-01' },
  { code: '09', name: 'Prison/Correctional Facility', description: 'A prison, jail, reformatory, work farm, detention center, or any other similar facility maintained by either Federal, State or local authorities for the purpose of confinement or rehabilitation of adult or juvenile criminal offenders. (Effective July 1, 2006)', effectiveDate: '2006-07-01' },
  { code: '10', name: 'Telehealth Provided in Patient\'s Home', description: 'The location where health services and health related services are provided or received, through telecommunication technology. Patient is located in their home (which is a location other than a hospital or other facility where the patient receives care in a private residence) when receiving health services or health related services through telecommunication technology. (This code is effective January 1, 2022, and available to Medicare April 1, 2022.)', effectiveDate: '2022-01-01' },
  { code: '11', name: 'Office', description: 'Location, other than a hospital, skilled nursing facility (SNF), military treatment facility, community health center, State or local public health clinic, or intermediate care facility (ICF), where the health professional routinely provides health examinations, diagnosis, and treatment of illness or injury on an ambulatory basis.', effectiveDate: null },
  { code: '12', name: 'Home', description: 'Location, other than a hospital or other facility, where the patient receives care in a private residence.', effectiveDate: null },
  { code: '13', name: 'Assisted Living Facility', description: 'Congregate residential facility with self-contained living units providing assessment of each resident\'s needs and on-site support 24 hours a day, 7 days a week, with the capacity to deliver or arrange for services including some health care and other services. (Effective October 1, 2003)', effectiveDate: '2003-10-01' },
  { code: '14', name: 'Group Home', description: 'A residence, with shared living areas, where clients receive supervision and other services such as social and/or behavioral services, custodial service, and minimal services (e.g., medication administration). (Effective October 1, 2003) (Revised, effective April 1, 2004)', effectiveDate: '2003-10-01' },
  { code: '15', name: 'Mobile Unit', description: 'A facility/unit that moves from place-to-place equipped to provide preventive, screening, diagnostic, and/or treatment services. (Effective January 1, 2003)', effectiveDate: '2003-01-01' },
  { code: '16', name: 'Temporary Lodging', description: 'A short term accommodation such as a hotel, camp ground, hostel, cruise ship or resort where the patient receives care, and which is not identified by any other POS code. (Effective January 1, 2008)', effectiveDate: '2008-01-01' },
  { code: '17', name: 'Walk-in Retail Health Clinic', description: 'A walk-in health clinic, other than an office, urgent care facility, pharmacy or independent clinic and not described by any other Place of Service code, that is located within a retail operation and provides, on an ambulatory basis, preventive and primary care services. (This code is available for use immediately with a final effective date of May 1, 2010)', effectiveDate: '2010-05-01' },
  { code: '18', name: 'Place of Employment-Worksite', description: 'A location, not described by any other POS code, owned or operated by a public or private entity where the patient is employed, and where a health professional provides on-going or episodic occupational medical, therapeutic or rehabilitative services to the individual. (This code is available for use effective January 1, 2013 but no later than May 1, 2013)', effectiveDate: '2013-01-01' },
  { code: '19', name: 'Off Campus-Outpatient Hospital', description: 'A portion of an off-campus hospital provider based department which provides diagnostic, therapeutic (both surgical and nonsurgical), and rehabilitation services to sick or injured persons who do not require hospitalization or institutionalization. (Effective January 1, 2016)', effectiveDate: '2016-01-01' },
  { code: '20', name: 'Urgent Care Facility', description: 'Location, distinct from a hospital emergency room, an office, or a clinic, whose purpose is to diagnose and treat illness or injury for unscheduled, ambulatory patients seeking immediate medical attention. (Effective January 1, 2003)', effectiveDate: '2003-01-01' },
  { code: '21', name: 'Inpatient Hospital', description: 'A facility, other than psychiatric, which primarily provides diagnostic, therapeutic (both surgical and nonsurgical), and rehabilitation services by, or under, the supervision of physicians to patients admitted for a variety of medical conditions.', effectiveDate: null },
  { code: '22', name: 'On Campus-Outpatient Hospital', description: 'A portion of a hospital\'s main campus which provides diagnostic, therapeutic (both surgical and nonsurgical), and rehabilitation services to sick or injured persons who do not require hospitalization or institutionalization. (Description change effective January 1, 2016)', effectiveDate: '2016-01-01' },
  { code: '23', name: 'Emergency Room – Hospital', description: 'A portion of a hospital where emergency diagnosis and treatment of illness or injury is provided.', effectiveDate: null },
  { code: '24', name: 'Ambulatory Surgical Center', description: 'A freestanding facility, other than a physician\'s office, where surgical and diagnostic services are provided on an ambulatory basis.', effectiveDate: null },
  { code: '25', name: 'Birthing Center', description: 'A facility, other than a hospital\'s maternity facilities or a physician\'s office, which provides a setting for labor, delivery, and immediate post-partum care as well as immediate care of new born infants.', effectiveDate: null },
  { code: '26', name: 'Military Treatment Facility', description: 'A medical facility operated by one or more of the Uniformed Services. Military Treatment Facility (MTF) also refers to certain former U.S. Public Health Service (USPHS) facilities now designated as Uniformed Service Treatment Facilities (USTF).', effectiveDate: null },
  { code: '27', name: 'Outreach Site/Street', description: 'A non-permanent location on the street or found environment, not described by any other POS code, where health professionals provide preventive, screening, diagnostic, and/or treatment services to unsheltered homeless individuals. (Effective October 1, 2023)', effectiveDate: '2023-10-01' },
  { code: '31', name: 'Skilled Nursing Facility', description: 'A facility which primarily provides inpatient skilled nursing care and related services to patients who require medical, nursing, or rehabilitative services but does not provide the level of care or treatment available in a hospital.', effectiveDate: null },
  { code: '32', name: 'Nursing Facility', description: 'A facility which primarily provides to residents skilled nursing care and related services for the rehabilitation of injured, disabled, or sick persons, or, on a regular basis, health-related care services above the level of custodial care to other than individuals with intellectual disabilities.', effectiveDate: null },
  { code: '33', name: 'Custodial Care Facility', description: 'A facility which provides room, board and other personal assistance services, generally on a long-term basis, and which does not include a medical component.', effectiveDate: null },
  { code: '34', name: 'Hospice', description: 'A facility, other than a patient\'s home, in which palliative and supportive care for terminally ill patients and their families are provided.', effectiveDate: null },
  { code: '41', name: 'Ambulance - Land', description: 'A land vehicle specifically designed, equipped and staffed for lifesaving and transporting the sick or injured.', effectiveDate: null },
  { code: '42', name: 'Ambulance – Air or Water', description: 'An air or water vehicle specifically designed, equipped and staffed for lifesaving and transporting the sick or injured.', effectiveDate: null },
  { code: '49', name: 'Independent Clinic', description: 'A location, not part of a hospital and not described by any other Place of Service code, that is organized and operated to provide preventive, diagnostic, therapeutic, rehabilitative, or palliative services to outpatients only. (Effective October 1, 2023)', effectiveDate: '2023-10-01' },
  { code: '50', name: 'Federally Qualified Health Center', description: 'A facility located in a medically underserved area that provides Medicare beneficiaries preventive primary medical care under the general direction of a physician.', effectiveDate: null },
  { code: '51', name: 'Inpatient Psychiatric Facility', description: 'A facility that provides inpatient psychiatric services for the diagnosis and treatment of mental illness on a 24-hour basis, by or under the supervision of a physician.', effectiveDate: null },
  { code: '52', name: 'Psychiatric Facility-Partial Hospitalization', description: 'A facility for the diagnosis and treatment of mental illness that provides a planned therapeutic program for patients who do not require full time hospitalization, but who need broader programs than are possible from outpatient visits to a hospital-based or hospital-affiliated facility.', effectiveDate: null },
  { code: '53', name: 'Community Mental Health Center', description: 'A facility that provides the following services: outpatient services, including specialized outpatient services for children, the elderly, individuals who are chronically ill, and residents of the CMHC\'s mental health services area who have been discharged from inpatient treatment at a mental health facility; 24 hour a day emergency care services; day treatment, other partial hospitalization services, or psychosocial rehabilitation services; screening for patients being considered for admission to State mental health facilities to determine the appropriateness of such admission; and consultation and education services.', effectiveDate: null },
  { code: '54', name: 'Intermediate Care Facility/Individuals with Intellectual Disabilities', description: 'A facility which primarily provides health-related care and services above the level of custodial care to individuals but does not provide the level of care or treatment available in a hospital or SNF.', effectiveDate: null },
  { code: '55', name: 'Residential Substance Abuse Treatment Facility', description: 'A facility which provides treatment for substance (alcohol and drug) abuse to live-in residents who do not require acute medical care. Services include individual and group therapy and counseling, family counseling, laboratory tests, drugs and supplies, psychological testing, and room and board.', effectiveDate: null },
  { code: '56', name: 'Psychiatric Residential Treatment Center', description: 'A facility or distinct part of a facility for psychiatric care which provides a total 24-hour therapeutically planned and professionally staffed group living and learning environment.', effectiveDate: null },
  { code: '57', name: 'Non-residential Substance Abuse Treatment Facility', description: 'A location which provides treatment for substance (alcohol and drug) abuse on an ambulatory basis. Services include individual and group therapy and counseling, family counseling, laboratory tests, drugs and supplies, and psychological testing. (Effective October 1, 2023)', effectiveDate: '2023-10-01' },
  { code: '58', name: 'Non-residential Opioid Treatment Facility', description: 'A location that provides treatment for opioid use disorder on an ambulatory basis. Services include methadone and other forms of Medication Assisted Treatment (MAT) (Effective January 1, 2020)', effectiveDate: '2020-01-01' },
  { code: '60', name: 'Mass Immunization Center', description: 'A location where providers administer pneumococcal pneumonia and influenza virus vaccinations and submit these services as electronic media claims, paper claims, or using the roster billing method. This generally takes place in a mass immunization setting, such as, a public health center, pharmacy, or mall but may include a physician office setting.', effectiveDate: null },
  { code: '61', name: 'Comprehensive Inpatient Rehabilitation Facility', description: 'A facility that provides comprehensive rehabilitation services under the supervision of a physician to inpatients with physical disabilities. Services include physical therapy, occupational therapy, speech pathology, social or psychological services, and orthotics and prosthetics services.', effectiveDate: null },
  { code: '62', name: 'Comprehensive Outpatient Rehabilitation Facility', description: 'A facility that provides comprehensive rehabilitation services under the supervision of a physician to outpatients with physical disabilities. Services include physical therapy, occupational therapy, and speech pathology services.', effectiveDate: null },
  { code: '65', name: 'End-Stage Renal Disease Treatment Facility', description: 'A facility other than a hospital, which provides dialysis treatment, maintenance, and/or training to patients or caregivers on an ambulatory or home-care basis.', effectiveDate: null },
  { code: '66', name: 'Programs of All-Inclusive Care for the Elderly (PACE) Center', description: 'A facility or location providing comprehensive medical and social services as part of the Programs of All-Inclusive Care for the Elderly (PACE). This includes, but is not limited to, primary care; social work services; restorative therapies, including physical and occupational therapy; personal care and supportive services; nutritional counseling; recreational therapy; and meals when the individual is enrolled in PACE. (Effective August 1, 2024)', effectiveDate: '2024-08-01' },
  { code: '71', name: 'Public Health Clinic', description: 'A facility maintained by either State or local health departments that provides ambulatory primary medical care under the general direction of a physician.', effectiveDate: null },
  { code: '72', name: 'Rural Health Clinic', description: 'A certified facility which is located in a rural medically underserved area that provides ambulatory primary medical care under the general direction of a physician.', effectiveDate: null },
  { code: '81', name: 'Independent Laboratory', description: 'A laboratory certified to perform diagnostic and/or clinical tests independent of an institution or a physician\'s office.', effectiveDate: null },
  { code: '99', name: 'Other Place of Service', description: 'Other place of service not identified above.', effectiveDate: null }
];

async function populatePOSCodes() {
  console.log('🏥 Starting Place of Service (POS) codes population...');

  try {
    const db = initializeDatabase();

    console.log(`📝 Preparing to insert ${posData.length} POS codes...`);

    // Get existing POS codes to avoid duplicates
    const existingResult = await db.execute(sql.raw('SELECT pos_code FROM place_of_service'));
    const existingCodes = new Set(existingResult.rows.map(row => row.pos_code));
    
    console.log(`📊 Found ${existingCodes.size} existing POS codes in database`);

    // Filter out existing codes
    const newPosData = posData.filter(pos => !existingCodes.has(pos.code));
    
    if (newPosData.length === 0) {
      console.log('ℹ️ All POS codes already exist in database. No new codes to insert.');
      return;
    }

    console.log(`📝 ${newPosData.length} new POS codes to insert`);

    // Insert new POS codes in batches
    const batchSize = 10;
    let insertedCount = 0;
    
    for (let i = 0; i < newPosData.length; i += batchSize) {
      const batch = newPosData.slice(i, i + batchSize);
      console.log(`⚡ Inserting batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(newPosData.length / batchSize)} (${batch.length} codes)...`);

      const values = batch.map(pos => 
        `('${pos.code}', '${pos.description.replace(/'/g, "''")}', '${pos.name.replace(/'/g, "''")}', true, ${pos.effectiveDate ? `'${pos.effectiveDate}'` : "'1900-01-01'"}, NOW(), NOW())`
      ).join(',\n    ');

      const insertSQL = `
        INSERT INTO place_of_service (
          pos_code,
          description,
          short_description,
          is_active,
          effective_date,
          created_at,
          updated_at
        ) VALUES
        ${values}
      `;

      await db.execute(sql.raw(insertSQL));
      insertedCount += batch.length;
      console.log(`✅ Batch ${Math.floor(i / batchSize) + 1} inserted successfully (${batch.length} codes)`);
    }

    // Create indexes if they don't exist (matching schema definitions)
    await db.execute(sql.raw('CREATE INDEX IF NOT EXISTS place_of_service_pos_code_idx ON place_of_service(pos_code)'));
    await db.execute(sql.raw('CREATE INDEX IF NOT EXISTS place_of_service_active_idx ON place_of_service(is_active)'));

    // Verify the population by counting records
    const countResult = await db.execute(sql.raw('SELECT COUNT(*) as count FROM place_of_service'));
    const count = countResult.rows[0]?.count || 0;

    console.log(`✅ POS codes population completed successfully!`);
    console.log(`📊 Inserted ${insertedCount} new POS codes`);
    console.log(`📊 Total POS codes in database: ${count}`);

  } catch (error) {
    console.error('❌ Error populating POS codes:', error);
    throw error;
  }
}

async function main() {
  try {
    await populatePOSCodes();
    console.log('🎉 All done!');
    process.exit(0);
  } catch (error) {
    console.error('💥 Script failed:', error);
    process.exit(1);
  }
}

main();