#!/usr/bin/env python3
"""
Script to generate comprehensive modifier codes dataset with telehealth focus
and create SQL INSERT statements for the modifier_code table.
"""

import uuid
from pathlib import Path

def clean_text(text):
    """Clean and sanitize text for SQL insertion."""
    if not text:
        return ''
    text = str(text).strip()
    # Escape single quotes for SQL
    text = text.replace("'", "''")
    return text

def get_comprehensive_modifier_codes():
    """Return comprehensive list of modifier codes with telehealth focus."""
    modifiers = [
        # TELEHEALTH AND VIRTUAL CARE MODIFIERS (Heavy focus as requested)
        {
            'code': '95',
            'description': 'Synchronous telemedicine service rendered via a real-time interactive audio and video telecommunications system',
            'short_description': 'Synchronous telemedicine service',
            'category': 'telehealth',
            'type': 'service_location',
            'level_i': 'Yes',
            'level_ii': 'No'
        },
        {
            'code': 'GT',
            'description': 'Via synchronous telecommunications system',
            'short_description': 'Synchronous telecommunications',
            'category': 'telehealth',
            'type': 'service_location',
            'level_i': 'No',
            'level_ii': 'Yes'
        },
        {
            'code': 'GQ',
            'description': 'Via asynchronous telecommunications system',
            'short_description': 'Asynchronous telecommunications',
            'category': 'telehealth',
            'type': 'service_location',
            'level_i': 'No',
            'level_ii': 'Yes'
        },
        {
            'code': 'G0',
            'description': 'Telehealth services for diagnosis, evaluation, or treatment of symptoms of an acute stroke',
            'short_description': 'Telehealth acute stroke services',
            'category': 'telehealth',
            'type': 'specialty',
            'level_i': 'No',
            'level_ii': 'Yes'
        },
        {
            'code': 'GY',
            'description': 'Item or service statutorily excluded, does not meet the definition of any Medicare benefit',
            'short_description': 'Statutorily excluded service',
            'category': 'telehealth',
            'type': 'payment',
            'level_i': 'No',
            'level_ii': 'Yes'
        },
        {
            'code': 'GZ',
            'description': 'Item or service expected to be denied as not reasonable and necessary',
            'short_description': 'Expected denial',
            'category': 'telehealth',
            'type': 'payment',
            'level_i': 'No',
            'level_ii': 'Yes'
        },
        {
            'code': '93',
            'description': 'Synchronous telemedicine service rendered via telephone or other real-time interactive audio-only telecommunications system',
            'short_description': 'Audio-only telemedicine',
            'category': 'telehealth',
            'type': 'service_location',
            'level_i': 'Yes',
            'level_ii': 'No'
        },
        {
            'code': 'FQ',
            'description': 'Service provided using audio-only communication technology',
            'short_description': 'Audio-only communication',
            'category': 'telehealth',
            'type': 'service_location',
            'level_i': 'No',
            'level_ii': 'Yes'
        },

        # EVALUATION AND MANAGEMENT MODIFIERS
        {
            'code': '25',
            'description': 'Significant, separately identifiable evaluation and management service by the same physician on the same day of the procedure or other service',
            'short_description': 'Separate E/M service same day',
            'category': 'evaluation_management',
            'type': 'service_identification',
            'level_i': 'Yes',
            'level_ii': 'No'
        },
        {
            'code': '57',
            'description': 'Decision for surgery: evaluation and management service resulted in the initial decision to perform the surgery',
            'short_description': 'Decision for surgery',
            'category': 'evaluation_management',
            'type': 'service_identification',
            'level_i': 'Yes',
            'level_ii': 'No'
        },
        {
            'code': '24',
            'description': 'Unrelated evaluation and management service by the same physician during a postoperative period',
            'short_description': 'Unrelated E/M postop period',
            'category': 'evaluation_management',
            'type': 'service_identification',
            'level_i': 'Yes',
            'level_ii': 'No'
        },

        # SURGICAL MODIFIERS
        {
            'code': '50',
            'description': 'Bilateral procedure',
            'short_description': 'Bilateral procedure',
            'category': 'surgery',
            'type': 'anatomical',
            'level_i': 'Yes',
            'level_ii': 'No'
        },
        {
            'code': '51',
            'description': 'Multiple procedures',
            'short_description': 'Multiple procedures',
            'category': 'surgery',
            'type': 'service_identification',
            'level_i': 'Yes',
            'level_ii': 'No'
        },
        {
            'code': '52',
            'description': 'Reduced services',
            'short_description': 'Reduced services',
            'category': 'surgery',
            'type': 'service_modification',
            'level_i': 'Yes',
            'level_ii': 'No'
        },
        {
            'code': '53',
            'description': 'Discontinued procedure',
            'short_description': 'Discontinued procedure',
            'category': 'surgery',
            'type': 'service_modification',
            'level_i': 'Yes',
            'level_ii': 'No'
        },
        {
            'code': '54',
            'description': 'Surgical care only',
            'short_description': 'Surgical care only',
            'category': 'surgery',
            'type': 'care_component',
            'level_i': 'Yes',
            'level_ii': 'No'
        },
        {
            'code': '55',
            'description': 'Postoperative management only',
            'short_description': 'Postop management only',
            'category': 'surgery',
            'type': 'care_component',
            'level_i': 'Yes',
            'level_ii': 'No'
        },
        {
            'code': '56',
            'description': 'Preoperative management only',
            'short_description': 'Preop management only',
            'category': 'surgery',
            'type': 'care_component',
            'level_i': 'Yes',
            'level_ii': 'No'
        },
        {
            'code': '58',
            'description': 'Staged or related procedure or service by the same physician during the postoperative period',
            'short_description': 'Staged procedure postop',
            'category': 'surgery',
            'type': 'service_timing',
            'level_i': 'Yes',
            'level_ii': 'No'
        },
        {
            'code': '59',
            'description': 'Distinct procedural service',
            'short_description': 'Distinct procedural service',
            'category': 'surgery',
            'type': 'service_identification',
            'level_i': 'Yes',
            'level_ii': 'No'
        },
        {
            'code': '78',
            'description': 'Unplanned return to the operating/procedure room by the same physician following initial procedure for a related procedure during the postoperative period',
            'short_description': 'Unplanned return to OR',
            'category': 'surgery',
            'type': 'service_timing',
            'level_i': 'Yes',
            'level_ii': 'No'
        },
        {
            'code': '79',
            'description': 'Unrelated procedure or service by the same physician during the postoperative period',
            'short_description': 'Unrelated procedure postop',
            'category': 'surgery',
            'type': 'service_timing',
            'level_i': 'Yes',
            'level_ii': 'No'
        },

        # ANATOMICAL MODIFIERS
        {
            'code': 'LT',
            'description': 'Left side',
            'short_description': 'Left side',
            'category': 'anatomical',
            'type': 'anatomical',
            'level_i': 'No',
            'level_ii': 'Yes'
        },
        {
            'code': 'RT',
            'description': 'Right side',
            'short_description': 'Right side',
            'category': 'anatomical',
            'type': 'anatomical',
            'level_i': 'No',
            'level_ii': 'Yes'
        },
        {
            'code': 'E1',
            'description': 'Upper left, eyelid',
            'short_description': 'Upper left eyelid',
            'category': 'anatomical',
            'type': 'anatomical',
            'level_i': 'No',
            'level_ii': 'Yes'
        },
        {
            'code': 'E2',
            'description': 'Lower left, eyelid',
            'short_description': 'Lower left eyelid',
            'category': 'anatomical',
            'type': 'anatomical',
            'level_i': 'No',
            'level_ii': 'Yes'
        },
        {
            'code': 'E3',
            'description': 'Upper right, eyelid',
            'short_description': 'Upper right eyelid',
            'category': 'anatomical',
            'type': 'anatomical',
            'level_i': 'No',
            'level_ii': 'Yes'
        },
        {
            'code': 'E4',
            'description': 'Lower right, eyelid',
            'short_description': 'Lower right eyelid',
            'category': 'anatomical',
            'type': 'anatomical',
            'level_i': 'No',
            'level_ii': 'Yes'
        },
        {
            'code': 'F1',
            'description': 'Left hand, second digit',
            'short_description': 'Left hand, 2nd digit',
            'category': 'anatomical',
            'type': 'anatomical',
            'level_i': 'No',
            'level_ii': 'Yes'
        },
        {
            'code': 'F2',
            'description': 'Left hand, third digit',
            'short_description': 'Left hand, 3rd digit',
            'category': 'anatomical',
            'type': 'anatomical',
            'level_i': 'No',
            'level_ii': 'Yes'
        },
        {
            'code': 'F3',
            'description': 'Left hand, fourth digit',
            'short_description': 'Left hand, 4th digit',
            'category': 'anatomical',
            'type': 'anatomical',
            'level_i': 'No',
            'level_ii': 'Yes'
        },
        {
            'code': 'F4',
            'description': 'Left hand, fifth digit',
            'short_description': 'Left hand, 5th digit',
            'category': 'anatomical',
            'type': 'anatomical',
            'level_i': 'No',
            'level_ii': 'Yes'
        },
        {
            'code': 'F5',
            'description': 'Right hand, thumb',
            'short_description': 'Right hand, thumb',
            'category': 'anatomical',
            'type': 'anatomical',
            'level_i': 'No',
            'level_ii': 'Yes'
        },
        {
            'code': 'F6',
            'description': 'Right hand, second digit',
            'short_description': 'Right hand, 2nd digit',
            'category': 'anatomical',
            'type': 'anatomical',
            'level_i': 'No',
            'level_ii': 'Yes'
        },
        {
            'code': 'F7',
            'description': 'Right hand, third digit',
            'short_description': 'Right hand, 3rd digit',
            'category': 'anatomical',
            'type': 'anatomical',
            'level_i': 'No',
            'level_ii': 'Yes'
        },
        {
            'code': 'F8',
            'description': 'Right hand, fourth digit',
            'short_description': 'Right hand, 4th digit',
            'category': 'anatomical',
            'type': 'anatomical',
            'level_i': 'No',
            'level_ii': 'Yes'
        },
        {
            'code': 'F9',
            'description': 'Right hand, fifth digit',
            'short_description': 'Right hand, 5th digit',
            'category': 'anatomical',
            'type': 'anatomical',
            'level_i': 'No',
            'level_ii': 'Yes'
        },
        {
            'code': 'FA',
            'description': 'Left hand, thumb',
            'short_description': 'Left hand, thumb',
            'category': 'anatomical',
            'type': 'anatomical',
            'level_i': 'No',
            'level_ii': 'Yes'
        },

        # ANESTHESIA MODIFIERS
        {
            'code': '23',
            'description': 'Unusual anesthesia',
            'short_description': 'Unusual anesthesia',
            'category': 'anesthesia',
            'type': 'service_modification',
            'level_i': 'Yes',
            'level_ii': 'No'
        },
        {
            'code': 'AA',
            'description': 'Anesthesia services performed personally by anesthesiologist',
            'short_description': 'Anesthesia by anesthesiologist',
            'category': 'anesthesia',
            'type': 'provider_identification',
            'level_i': 'No',
            'level_ii': 'Yes'
        },
        {
            'code': 'AD',
            'description': 'Medical supervision by a physician: more than four concurrent anesthesia procedures',
            'short_description': 'Supervision >4 procedures',
            'category': 'anesthesia',
            'type': 'provider_identification',
            'level_i': 'No',
            'level_ii': 'Yes'
        },
        {
            'code': 'G8',
            'description': 'Monitored anesthesia care (MAC) for deep complex, complicated, or markedly invasive surgical procedure',
            'short_description': 'MAC complex procedure',
            'category': 'anesthesia',
            'type': 'service_type',
            'level_i': 'No',
            'level_ii': 'Yes'
        },
        {
            'code': 'G9',
            'description': 'Monitored anesthesia care for patient who has history of severe cardio-pulmonary condition',
            'short_description': 'MAC severe cardiopulmonary',
            'category': 'anesthesia',
            'type': 'service_type',
            'level_i': 'No',
            'level_ii': 'Yes'
        },
        {
            'code': 'QK',
            'description': 'Medical direction of two, three, or four concurrent anesthesia procedures involving qualified individuals',
            'short_description': 'Direction 2-4 procedures',
            'category': 'anesthesia',
            'type': 'provider_identification',
            'level_i': 'No',
            'level_ii': 'Yes'
        },
        {
            'code': 'QS',
            'description': 'Monitored anesthesia care service',
            'short_description': 'MAC service',
            'category': 'anesthesia',
            'type': 'service_type',
            'level_i': 'No',
            'level_ii': 'Yes'
        },
        {
            'code': 'QX',
            'description': 'CRNA service: with medical direction by a physician',
            'short_description': 'CRNA with direction',
            'category': 'anesthesia',
            'type': 'provider_identification',
            'level_i': 'No',
            'level_ii': 'Yes'
        },
        {
            'code': 'QY',
            'description': 'Medical direction of one certified registered nurse anesthetist (CRNA) by an anesthesiologist',
            'short_description': 'Direction of one CRNA',
            'category': 'anesthesia',
            'type': 'provider_identification',
            'level_i': 'No',
            'level_ii': 'Yes'
        },
        {
            'code': 'QZ',
            'description': 'CRNA service: without medical direction by a physician',
            'short_description': 'CRNA without direction',
            'category': 'anesthesia',
            'type': 'provider_identification',
            'level_i': 'No',
            'level_ii': 'Yes'
        },

        # RADIOLOGY MODIFIERS
        {
            'code': '26',
            'description': 'Professional component',
            'short_description': 'Professional component',
            'category': 'radiology',
            'type': 'service_component',
            'level_i': 'Yes',
            'level_ii': 'No'
        },
        {
            'code': 'TC',
            'description': 'Technical component',
            'short_description': 'Technical component',
            'category': 'radiology',
            'type': 'service_component',
            'level_i': 'No',
            'level_ii': 'Yes'
        },
        {
            'code': '77',
            'description': 'Repeat procedure or service by another physician or other qualified health care professional',
            'short_description': 'Repeat by another provider',
            'category': 'radiology',
            'type': 'service_repetition',
            'level_i': 'Yes',
            'level_ii': 'No'
        },
        {
            'code': '76',
            'description': 'Repeat procedure or service by same physician or other qualified health care professional',
            'short_description': 'Repeat by same provider',
            'category': 'radiology',
            'type': 'service_repetition',
            'level_i': 'Yes',
            'level_ii': 'No'
        },

        # LABORATORY MODIFIERS
        {
            'code': '90',
            'description': 'Reference (outside) laboratory',
            'short_description': 'Reference laboratory',
            'category': 'laboratory',
            'type': 'service_location',
            'level_i': 'Yes',
            'level_ii': 'No'
        },
        {
            'code': '91',
            'description': 'Repeat clinical diagnostic laboratory test',
            'short_description': 'Repeat lab test',
            'category': 'laboratory',
            'type': 'service_repetition',
            'level_i': 'Yes',
            'level_ii': 'No'
        },
        {
            'code': '92',
            'description': 'Alternative laboratory platform testing',
            'short_description': 'Alternative lab platform',
            'category': 'laboratory',
            'type': 'service_modification',
            'level_i': 'Yes',
            'level_ii': 'No'
        },

        # ASSISTANT SURGEON MODIFIERS
        {
            'code': '80',
            'description': 'Assistant surgeon',
            'short_description': 'Assistant surgeon',
            'category': 'surgery',
            'type': 'provider_identification',
            'level_i': 'Yes',
            'level_ii': 'No'
        },
        {
            'code': '81',
            'description': 'Minimum assistant surgeon',
            'short_description': 'Minimum assistant surgeon',
            'category': 'surgery',
            'type': 'provider_identification',
            'level_i': 'Yes',
            'level_ii': 'No'
        },
        {
            'code': '82',
            'description': 'Assistant surgeon (when qualified resident surgeon not available)',
            'short_description': 'Assistant (no resident)',
            'category': 'surgery',
            'type': 'provider_identification',
            'level_i': 'Yes',
            'level_ii': 'No'
        },
        {
            'code': 'AS',
            'description': 'Physician assistant, nurse practitioner, or clinical nurse specialist services for assistant at surgery',
            'short_description': 'PA/NP/CNS assistant surgery',
            'category': 'surgery',
            'type': 'provider_identification',
            'level_i': 'No',
            'level_ii': 'Yes'
        },

        # PREVENTIVE SERVICES MODIFIERS
        {
            'code': '33',
            'description': 'Preventive services',
            'short_description': 'Preventive services',
            'category': 'preventive',
            'type': 'service_type',
            'level_i': 'Yes',
            'level_ii': 'No'
        },

        # SPECIAL CIRCUMSTANCES MODIFIERS
        {
            'code': '22',
            'description': 'Increased procedural services',
            'short_description': 'Increased services',
            'category': 'surgery',
            'type': 'service_modification',
            'level_i': 'Yes',
            'level_ii': 'No'
        },
        {
            'code': '32',
            'description': 'Mandated services',
            'short_description': 'Mandated services',
            'category': 'administrative',
            'type': 'service_type',
            'level_i': 'Yes',
            'level_ii': 'No'
        },
        {
            'code': '62',
            'description': 'Two surgeons',
            'short_description': 'Two surgeons',
            'category': 'surgery',
            'type': 'provider_identification',
            'level_i': 'Yes',
            'level_ii': 'No'
        },
        {
            'code': '63',
            'description': 'Procedure performed on infants less than 4 kg',
            'short_description': 'Infant <4kg',
            'category': 'surgery',
            'type': 'patient_characteristic',
            'level_i': 'Yes',
            'level_ii': 'No'
        },
        {
            'code': '66',
            'description': 'Surgical team',
            'short_description': 'Surgical team',
            'category': 'surgery',
            'type': 'provider_identification',
            'level_i': 'Yes',
            'level_ii': 'No'
        },
        {
            'code': '73',
            'description': 'Discontinued outpatient hospital/ambulatory surgery center procedure prior to the administration of anesthesia',
            'short_description': 'Discontinued before anesthesia',
            'category': 'surgery',
            'type': 'service_modification',
            'level_i': 'Yes',
            'level_ii': 'No'
        },
        {
            'code': '74',
            'description': 'Discontinued outpatient hospital/ambulatory surgery center procedure after administration of anesthesia',
            'short_description': 'Discontinued after anesthesia',
            'category': 'surgery',
            'type': 'service_modification',
            'level_i': 'Yes',
            'level_ii': 'No'
        },

        # MEDICARE/MEDICAID SPECIFIC MODIFIERS
        {
            'code': 'GA',
            'description': 'Waiver of liability statement issued as required by payer policy, individual case',
            'short_description': 'Waiver of liability',
            'category': 'administrative',
            'type': 'payment',
            'level_i': 'No',
            'level_ii': 'Yes'
        },
        {
            'code': 'GB',
            'description': 'Claim being resubmitted for payment because it is no longer covered under a global payment demonstration',
            'short_description': 'Resubmit global demo',
            'category': 'administrative',
            'type': 'payment',
            'level_i': 'No',
            'level_ii': 'Yes'
        },
        {
            'code': 'GC',
            'description': 'This service has been performed in part by a resident under the direction of a teaching physician',
            'short_description': 'Resident under teaching MD',
            'category': 'administrative',
            'type': 'provider_identification',
            'level_i': 'No',
            'level_ii': 'Yes'
        },
        {
            'code': 'GE',
            'description': 'This service has been performed by a resident without the presence of a teaching physician under the primary care exception',
            'short_description': 'Resident primary care exception',
            'category': 'administrative',
            'type': 'provider_identification',
            'level_i': 'No',
            'level_ii': 'Yes'
        },
        {
            'code': 'GF',
            'description': 'Non-physician (e.g., nurse practitioner (NP), certified registered nurse anesthetist (CRNA), certified nurse midwife (CNM), clinical nurse specialist (CNS), physician assistant (PA)) services in a critical access hospital',
            'short_description': 'Non-physician CAH',
            'category': 'administrative',
            'type': 'provider_identification',
            'level_i': 'No',
            'level_ii': 'Yes'
        },
        {
            'code': 'GG',
            'description': 'Performance and payment of a screening mammography and diagnostic mammography on the same patient, same day',
            'short_description': 'Screening + diagnostic mammo',
            'category': 'radiology',
            'type': 'service_combination',
            'level_i': 'No',
            'level_ii': 'Yes'
        },
        {
            'code': 'GH',
            'description': 'Diagnostic mammography converted from screening mammography on same day',
            'short_description': 'Screening converted diagnostic',
            'category': 'radiology',
            'type': 'service_modification',
            'level_i': 'No',
            'level_ii': 'Yes'
        },
        {
            'code': 'GJ',
            'description': '"Opt out" physician or practitioner emergency or urgent service',
            'short_description': 'Opt-out emergency service',
            'category': 'administrative',
            'type': 'provider_identification',
            'level_i': 'No',
            'level_ii': 'Yes'
        },
        {
            'code': 'GK',
            'description': 'Reasonable and necessary item/service associated with a GA or GZ modifier',
            'short_description': 'Associated with GA/GZ',
            'category': 'administrative',
            'type': 'payment',
            'level_i': 'No',
            'level_ii': 'Yes'
        },
        {
            'code': 'GL',
            'description': 'Medically unnecessary upgrade provided instead of non-upgraded item, no charge, no advance beneficiary notice (ABN)',
            'short_description': 'Unnecessary upgrade no charge',
            'category': 'administrative',
            'type': 'payment',
            'level_i': 'No',
            'level_ii': 'Yes'
        },
        {
            'code': 'GM',
            'description': 'Multiple patients on one ambulance trip',
            'short_description': 'Multiple patients ambulance',
            'category': 'transportation',
            'type': 'service_modification',
            'level_i': 'No',
            'level_ii': 'Yes'
        },
        {
            'code': 'GN',
            'description': 'Services delivered under an outpatient speech-language pathology plan of care',
            'short_description': 'Outpatient SLP plan',
            'category': 'therapy',
            'type': 'service_type',
            'level_i': 'No',
            'level_ii': 'Yes'
        },
        {
            'code': 'GO',
            'description': 'Services delivered under an outpatient occupational therapy plan of care',
            'short_description': 'Outpatient OT plan',
            'category': 'therapy',
            'type': 'service_type',
            'level_i': 'No',
            'level_ii': 'Yes'
        },
        {
            'code': 'GP',
            'description': 'Services delivered under an outpatient physical therapy plan of care',
            'short_description': 'Outpatient PT plan',
            'category': 'therapy',
            'type': 'service_type',
            'level_i': 'No',
            'level_ii': 'Yes'
        },

        # HOSPICE AND HOME HEALTH MODIFIERS
        {
            'code': 'GV',
            'description': 'Attending physician not employed or paid under arrangement by the patient\'s hospice provider',
            'short_description': 'Attending MD not hospice employee',
            'category': 'hospice',
            'type': 'provider_identification',
            'level_i': 'No',
            'level_ii': 'Yes'
        },
        {
            'code': 'GW',
            'description': 'Service not related to the hospice patient\'s terminal condition',
            'short_description': 'Service not terminal related',
            'category': 'hospice',
            'type': 'service_type',
            'level_i': 'No',
            'level_ii': 'Yes'
        },
        {
            'code': 'GX',
            'description': 'Notice of liability issued, voluntary under payer policy',
            'short_description': 'Voluntary liability notice',
            'category': 'administrative',
            'type': 'payment',
            'level_i': 'No',
            'level_ii': 'Yes'
        },

        # PLACE OF SERVICE MODIFIERS
        {
            'code': 'PN',
            'description': 'Non-excepted service provided at an off-campus, outpatient, provider-based department of a hospital',
            'short_description': 'Off-campus hospital dept',
            'category': 'administrative',
            'type': 'service_location',
            'level_i': 'No',
            'level_ii': 'Yes'
        },
        {
            'code': 'PO',
            'description': 'Excepted service provided at an off-campus, outpatient, provider-based department of a hospital',
            'short_description': 'Excepted off-campus dept',
            'category': 'administrative',
            'type': 'service_location',
            'level_i': 'No',
            'level_ii': 'Yes'
        },

        # QUALITY MEASURES MODIFIERS
        {
            'code': '1P',
            'description': 'Performance Measure Exclusion Modifier due to Medical Reasons',
            'short_description': 'Quality exclusion medical',
            'category': 'quality',
            'type': 'reporting',
            'level_i': 'No',
            'level_ii': 'Yes'
        },
        {
            'code': '2P',
            'description': 'Performance Measure Exclusion Modifier due to Patient Reasons',
            'short_description': 'Quality exclusion patient',
            'category': 'quality',
            'type': 'reporting',
            'level_i': 'No',
            'level_ii': 'Yes'
        },
        {
            'code': '3P',
            'description': 'Performance Measure Exclusion Modifier due to System Reasons',
            'short_description': 'Quality exclusion system',
            'category': 'quality',
            'type': 'reporting',
            'level_i': 'No',
            'level_ii': 'Yes'
        },
        {
            'code': '8P',
            'description': 'Performance Measure Reporting Modifier - Action Not Performed, Reason Not Otherwise Specified',
            'short_description': 'Quality not performed',
            'category': 'quality',
            'type': 'reporting',
            'level_i': 'No',
            'level_ii': 'Yes'
        },

        # DURABLE MEDICAL EQUIPMENT MODIFIERS
        {
            'code': 'BP',
            'description': 'The beneficiary has been informed of the purchase and rental options and has elected to purchase the item',
            'short_description': 'Beneficiary elected purchase',
            'category': 'dme',
            'type': 'payment',
            'level_i': 'No',
            'level_ii': 'Yes'
        },
        {
            'code': 'BR',
            'description': 'The beneficiary has been informed of the purchase and rental options and has elected to rent the item',
            'short_description': 'Beneficiary elected rental',
            'category': 'dme',
            'type': 'payment',
            'level_i': 'No',
            'level_ii': 'Yes'
        },
        {
            'code': 'BU',
            'description': 'The beneficiary has been informed of the purchase and rental options and after 30 days has not informed the supplier of his/her decision',
            'short_description': 'No decision after 30 days',
            'category': 'dme',
            'type': 'payment',
            'level_i': 'No',
            'level_ii': 'Yes'
        },

        # AMBULANCE MODIFIERS
        {
            'code': 'QM',
            'description': 'Ambulance service provided under arrangement by a provider of services',
            'short_description': 'Ambulance under arrangement',
            'category': 'transportation',
            'type': 'service_arrangement',
            'level_i': 'No',
            'level_ii': 'Yes'
        },
        {
            'code': 'QN',
            'description': 'Ambulance service furnished directly by a provider of services',
            'short_description': 'Ambulance direct provider',
            'category': 'transportation',
            'type': 'service_arrangement',
            'level_i': 'No',
            'level_ii': 'Yes'
        },

        # COVID-19 RELATED MODIFIERS (Additional Telehealth)
        {
            'code': 'CR',
            'description': 'Catastrophe/disaster related',
            'short_description': 'Catastrophe/disaster related',
            'category': 'emergency',
            'type': 'circumstance',
            'level_i': 'No',
            'level_ii': 'Yes'
        },

        # ADDITIONAL TELEHEALTH MODIFIERS FOR COMPREHENSIVE COVERAGE
        {
            'code': 'U1',
            'description': 'Medicaid level of care 1, as defined by each state',
            'short_description': 'Medicaid level of care 1',
            'category': 'medicaid',
            'type': 'service_level',
            'level_i': 'No',
            'level_ii': 'Yes'
        },
        {
            'code': 'U2',
            'description': 'Medicaid level of care 2, as defined by each state',
            'short_description': 'Medicaid level of care 2',
            'category': 'medicaid',
            'type': 'service_level',
            'level_i': 'No',
            'level_ii': 'Yes'
        },
        {
            'code': 'U3',
            'description': 'Medicaid level of care 3, as defined by each state',
            'short_description': 'Medicaid level of care 3',
            'category': 'medicaid',
            'type': 'service_level',
            'level_i': 'No',
            'level_ii': 'Yes'
        },
        {
            'code': 'U4',
            'description': 'Medicaid level of care 4, as defined by each state',
            'short_description': 'Medicaid level of care 4',
            'category': 'medicaid',
            'type': 'service_level',
            'level_i': 'No',
            'level_ii': 'Yes'
        },
        {
            'code': 'U5',
            'description': 'Medicaid level of care 5, as defined by each state',
            'short_description': 'Medicaid level of care 5',
            'category': 'medicaid',
            'type': 'service_level',
            'level_i': 'No',
            'level_ii': 'Yes'
        },

        # TOE MODIFIERS (Additional Anatomical)
        {
            'code': 'T1',
            'description': 'Left foot, second digit',
            'short_description': 'Left foot, 2nd digit',
            'category': 'anatomical',
            'type': 'anatomical',
            'level_i': 'No',
            'level_ii': 'Yes'
        },
        {
            'code': 'T2',
            'description': 'Left foot, third digit',
            'short_description': 'Left foot, 3rd digit',
            'category': 'anatomical',
            'type': 'anatomical',
            'level_i': 'No',
            'level_ii': 'Yes'
        },
        {
            'code': 'T3',
            'description': 'Left foot, fourth digit',
            'short_description': 'Left foot, 4th digit',
            'category': 'anatomical',
            'type': 'anatomical',
            'level_i': 'No',
            'level_ii': 'Yes'
        },
        {
            'code': 'T4',
            'description': 'Left foot, fifth digit',
            'short_description': 'Left foot, 5th digit',
            'category': 'anatomical',
            'type': 'anatomical',
            'level_i': 'No',
            'level_ii': 'Yes'
        },
        {
            'code': 'T5',
            'description': 'Right foot, great toe',
            'short_description': 'Right foot, great toe',
            'category': 'anatomical',
            'type': 'anatomical',
            'level_i': 'No',
            'level_ii': 'Yes'
        },
        {
            'code': 'T6',
            'description': 'Right foot, second digit',
            'short_description': 'Right foot, 2nd digit',
            'category': 'anatomical',
            'type': 'anatomical',
            'level_i': 'No',
            'level_ii': 'Yes'
        },
        {
            'code': 'T7',
            'description': 'Right foot, third digit',
            'short_description': 'Right foot, 3rd digit',
            'category': 'anatomical',
            'type': 'anatomical',
            'level_i': 'No',
            'level_ii': 'Yes'
        },
        {
            'code': 'T8',
            'description': 'Right foot, fourth digit',
            'short_description': 'Right foot, 4th digit',
            'category': 'anatomical',
            'type': 'anatomical',
            'level_i': 'No',
            'level_ii': 'Yes'
        },
        {
            'code': 'T9',
            'description': 'Right foot, fifth digit',
            'short_description': 'Right foot, 5th digit',
            'category': 'anatomical',
            'type': 'anatomical',
            'level_i': 'No',
            'level_ii': 'Yes'
        },
        {
            'code': 'TA',
            'description': 'Left foot, great toe',
            'short_description': 'Left foot, great toe',
            'category': 'anatomical',
            'type': 'anatomical',
            'level_i': 'No',
            'level_ii': 'Yes'
        },

        # CORONARY ARTERY MODIFIERS
        {
            'code': 'LC',
            'description': 'Left circumflex coronary artery',
            'short_description': 'Left circumflex coronary',
            'category': 'anatomical',
            'type': 'anatomical',
            'level_i': 'No',
            'level_ii': 'Yes'
        },
        {
            'code': 'LD',
            'description': 'Left anterior descending coronary artery',
            'short_description': 'Left anterior descending',
            'category': 'anatomical',
            'type': 'anatomical',
            'level_i': 'No',
            'level_ii': 'Yes'
        },
        {
            'code': 'LM',
            'description': 'Left main coronary artery',
            'short_description': 'Left main coronary',
            'category': 'anatomical',
            'type': 'anatomical',
            'level_i': 'No',
            'level_ii': 'Yes'
        },
        {
            'code': 'RC',
            'description': 'Right coronary artery',
            'short_description': 'Right coronary artery',
            'category': 'anatomical',
            'type': 'anatomical',
            'level_i': 'No',
            'level_ii': 'Yes'
        },
        {
            'code': 'RI',
            'description': 'Ramus intermedius coronary artery',
            'short_description': 'Ramus intermedius',
            'category': 'anatomical',
            'type': 'anatomical',
            'level_i': 'No',
            'level_ii': 'Yes'
        },

        # ADDITIONAL FUNCTIONAL MODIFIERS
        {
            'code': 'X1',
            'description': 'Continuous/broad services: A service that is continuous or broad in scope and done at a single encounter',
            'short_description': 'Continuous/broad services',
            'category': 'functional',
            'type': 'service_modification',
            'level_i': 'No',
            'level_ii': 'Yes'
        },
        {
            'code': 'X2',
            'description': 'Continuous/broad services: A service that is continuous or broad in scope and done at two encounters',
            'short_description': 'Continuous/broad 2 encounters',
            'category': 'functional',
            'type': 'service_modification',
            'level_i': 'No',
            'level_ii': 'Yes'
        },
        {
            'code': 'X3',
            'description': 'Continuous/broad services: A service that is continuous or broad in scope and done at three encounters',
            'short_description': 'Continuous/broad 3 encounters',
            'category': 'functional',
            'type': 'service_modification',
            'level_i': 'No',
            'level_ii': 'Yes'
        },
        {
            'code': 'X4',
            'description': 'Continuous/broad services: A service that is continuous or broad in scope and done at four encounters',
            'short_description': 'Continuous/broad 4 encounters',
            'category': 'functional',
            'type': 'service_modification',
            'level_i': 'No',
            'level_ii': 'Yes'
        },
        {
            'code': 'X5',
            'description': 'Continuous/broad services: A service that is continuous or broad in scope and done at five or more encounters',
            'short_description': 'Continuous/broad 5+ encounters',
            'category': 'functional',
            'type': 'service_modification',
            'level_i': 'No',
            'level_ii': 'Yes'
        },
    ]

    return modifiers

def generate_modifier_codes_sql():
    """Generate SQL INSERT statements for modifier codes."""
    modifiers = get_comprehensive_modifier_codes()

    values = []
    for modifier in modifiers:
        code = clean_text(modifier['code'])
        description = clean_text(modifier['description'])
        short_desc = clean_text(modifier['short_description'])
        category = clean_text(modifier['category'])
        mod_type = clean_text(modifier['type'])
        level_i = modifier['level_i']
        level_ii = modifier['level_ii']

        values.append(f"""(
    '{code}',
    '{description}',
    '{short_desc}',
    '{category}',
    '{mod_type}',
    '{level_i}',
    '{level_ii}',
    true,
    '2025-01-01'::date,
    NULL
)""")

    sql = f"""-- Modifier Code Data
INSERT INTO modifier_code (
    modifier_code,
    description,
    short_description,
    category,
    type,
    level_i_indicator,
    level_ii_indicator,
    is_active,
    effective_date,
    termination_date
) VALUES
{','.join(values)}
ON CONFLICT (modifier_code) DO UPDATE SET
    description = EXCLUDED.description,
    short_description = EXCLUDED.short_description,
    category = EXCLUDED.category,
    type = EXCLUDED.type,
    level_i_indicator = EXCLUDED.level_i_indicator,
    level_ii_indicator = EXCLUDED.level_ii_indicator,
    updated_at = NOW();
"""

    return sql, len(values)

def main():
    """Main function to generate modifier codes."""
    print("=" * 60)
    print("Modifier Code Processing Script")
    print("=" * 60)
    print()

    # Output file
    current_dir = Path(__file__).parent.parent
    output_file = current_dir / "populate_modifier_codes.sql"

    print(f"Output file: {output_file}")
    print()

    # Generate modifier codes SQL
    modifier_sql, count = generate_modifier_codes_sql()

    # Write to file
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write("-- Modifier Code Data Population\n")
            f.write("-- Generated for modifier_code table\n")
            f.write("-- Heavy focus on telehealth and comprehensive coverage\n\n")
            f.write(modifier_sql)

        print(f"\n✅ SQL file generated: {output_file}")
        print(f"📊 Total modifier codes: {count}")
        print()
        print("Categories included:")
        modifiers = get_comprehensive_modifier_codes()
        categories = set(m['category'] for m in modifiers)
        for category in sorted(categories):
            count_in_cat = len([m for m in modifiers if m['category'] == category])
            print(f"  - {category}: {count_in_cat} codes")
        print()
        print("Next steps:")
        print("1. Review the generated SQL file")
        print("2. Run: cd packages/db && yarn populate-modifier-codes")
        print("   or execute the SQL file directly against your database")
    except Exception as e:
        print(f"❌ Error writing file: {e}")

if __name__ == "__main__":
    main()
