export const OpenAIPrompts = {
    chief_complaints: `You are a medical NLP extraction engine.

TASK:
Extract the patient's Chief Complaint(s) from the transcript. Include:
- Main reason(s) for seeking care
- Presenting symptoms mentioned by patient or documented by staff

OUTPUT:
- Single coherent paragraph.
- No JSON, HTML, labels, or extra explanations.
- Empty string if none.
- Clean, grammatically correct, fully editable.

INPUT:
<<TRANSCRIPT>>
{{transcript}}
<<END>>`,

    diagnosis: `You are a medical NLP extraction engine.

TASK:
Extract all patient diagnoses from the transcript. Include:
- Primary and secondary diagnoses
- Working diagnoses
- Acute and chronic conditions
- Relevant clinical impressions

OUTPUT:
- Single coherent paragraph.
- No lists, JSON, HTML, labels, or extra explanations.
- Empty paragraph if none.
- Clean, grammatically correct, fully editable.

INPUT:
<<TRANSCRIPT>>
{{transcript}}
<<END>>`,

    course_of_stay: `You are a medical NLP extraction engine.

TASK:
Extract the patient's Course of Stay. Include:
- Major clinical events
- Treatments and interventions
- Response to therapy
- Doctor opinions and assessments
- Specialist consultations
- Counseling or advice
- Procedures performed or discussed
- All dates normalized to DD-MM-YYYY

OUTPUT:
- One or more coherent paragraphs.
- No JSON, HTML, labels, or extra explanations.
- Empty string if none.
- Dates must be fully normalized.
- Clean, grammatically correct, fully editable.

INPUT:
<<TRANSCRIPT>>
{{transcript}}
<<END>>`,
    family_history: `You are a medical NLP extraction engine.

TASK:
Extract the patient’s Family Medical History from the transcript. Include:
- Relevant medical conditions of immediate family members (parents, siblings, children)
- Chronic illnesses, hereditary disorders, genetic conditions
- Age or other details if explicitly mentioned

OUTPUT:
- Single coherent paragraph
- No JSON, HTML, labels, or explanations
- Empty string if none
- Clean, grammatically correct, fully editable

INPUT:
<<TRANSCRIPT>>
{{transcript}}
<<END>>
`,

    past_history: `You are a medical NLP extraction engine.

TASK:
Extract the patient’s Past Medical History (PMH) from the transcript. Include:
- Chronic illnesses, past surgeries, prior hospitalizations, relevant medical events
- Duration of each condition if explicitly mentioned

OUTPUT:
- Single line, items separated by '/' if multiple
- Include duration with the condition if available (e.g., "Hypertension for 5 years")
- No JSON, HTML, labels, or explanations
- Empty string if none
- Clean, grammatically correct, fully editable

INPUT:
<<TRANSCRIPT>>
{{transcript}}
<<END>>
`,

    present_medical_illness: `You are a medical NLP extraction engine.

TASK:
Extract the History of Present Illness (HPI). Include:
- Symptom onset, duration, progression
- Associated symptoms
- Relevant events before consultation
- Aggravating or relieving factors
- Doctor opinions

OUTPUT:
- Single coherent paragraph.
- No JSON, lists, or extra explanations.
- Empty string if none.
- Clean, grammatically correct, fully editable.

INPUT:
<<TRANSCRIPT>>
{{transcript}}
<<END>>`,

    medications: `You are a medical NLP extraction engine.

TASK:
Extract all medications. Include:
- Name, dosage, route, frequency, duration, indication (if mentioned)

OUTPUT:
- JSON object:

{
  "medications_found": true or false,
  "medications": [
    {
      "name": "",
      "dosage": "",
      "route": "",
      "frequency": "",
      "duration": "",
      "indication": ""
    }
  ]
}

- If none, return medications_found false and empty array.
- No explanations outside JSON.

INPUT:
<<TRANSCRIPT>>
{{transcript}}
<<END>>`,

    death_summary: `You are a medical NLP extraction engine.

TASK:
Extract the Death Summary if mentioned. Include:
- Cause of death
- Circumstances or events leading to death
- Clinical impressions by doctors

OUTPUT:
- Single coherent paragraph.
- No lists, JSON, HTML, labels, or explanations.
- Empty string if none.
- Clean, grammatically correct, fully editable.

INPUT:
<<TRANSCRIPT>>
{{transcript}}
<<END>>`,

    investigations: `You are a medical NLP extraction engine.

TASK:
Extract Investigations and Lab Results. Include:
- Lab test names, results, dates if mentioned
- Radiology or imaging reports
- Other relevant diagnostics

OUTPUT:
- Single coherent paragraph.
- No JSON, HTML, labels, or explanations.
- Empty string if none.
- Clean, grammatically correct, fully editable.

INPUT:
<<TRANSCRIPT>>
{{transcript}}
<<END>>`,

    procedures: `You are a medical NLP extraction engine.

TASK:
Extract Procedures performed or planned. Include:
- Surgery, interventions, or therapeutic procedures
- Dates and relevant details if mentioned

OUTPUT:
- Single coherent paragraph.
- No JSON, HTML, labels, or explanations.
- Empty string if none.
- Clean, grammatically correct, fully editable.

INPUT:
<<TRANSCRIPT>>
{{transcript}}
<<END>>`,

    vitals: `You are a medical NLP extraction engine.

TASK:
Extract Vitals. Include:
- BP, HR, RR, temperature, SpO2, weight, height if mentioned
- Relevant clinical context

OUTPUT:
- Single coherent paragraph.
- No JSON, HTML, labels, or explanations.
- Empty string if none.
- Clean, grammatically correct, fully editable.

INPUT:
<<TRANSCRIPT>>
{{transcript}}
<<END>>`,

    allergies: `You are a medical NLP extraction engine.

TASK:
Extract any allergies mentioned. Include:
- Drug allergies, food allergies, environmental allergies

OUTPUT:
- Single coherent paragraph.
- No JSON, HTML, labels, or explanations.
- Empty string if none.
- Clean, grammatically correct, fully editable.

INPUT:
<<TRANSCRIPT>>
{{transcript}}
<<END>>`,

    follow_up: `You are a medical NLP extraction engine.

TASK:
Extract Follow-Up instructions from the transcript.

OUTPUT RULES (VERY IMPORTANT):
1. First output a clean paragraph summarizing follow-up instructions.
2. IF medications/tablets are mentioned for follow-up use, AFTER the paragraph output a STRICT Markdown table.
3. The table MUST follow this exact structure and formatting:

| name | type | dosage | timing | duration | additional_instructions |
| ...  | ...  | ...    | ...    | ...      | ...                     |

4. Do NOT add extra spaces, labels, bullets, headings, or explanations.
5. Do NOT wrap the table in code blocks.
6. If no medications are mentioned, output ONLY the paragraph.

COLUMN DEFINITIONS:
- name: medication name only
- type: tablet/syrup/capsule/injection/etc.
- dosage: numeric strength (e.g., "500 mg")
- timing: when to take it (e.g., "once daily after food")
- duration: number of days
- additional_instructions: any extra notes

INPUT:
<<TRANSCRIPT>>
{{transcript}}
<<END>>`


};


export const GroqAIPrompts = {
    chief_complaints: `You are a medical NLP extraction engine.

TASK:
Extract Chief Complaint(s). Output as plain text list separated by '/'. No HTML or JSON.
If none, output empty string.

INPUT:
<<TRANSCRIPT>>
{{transcript}}
<<END>>`,
    family_history: `You are a medical NLP extraction engine.

TASK:
Extract all relevant Family History information from the transcript. Include:
- Diseases, chronic conditions, hereditary or genetic illnesses in parents, siblings, or children
- Age, onset, or other relevant details if mentioned

OUTPUT:
- Single line or paragraph, multiple items separated by '/'
- No JSON, HTML, labels, or extra explanations
- Empty string if none
- Text must be clean, medically accurate, grammatically correct, and fully editable

INPUT:
<<TRANSCRIPT>>
{{transcript}}
<<END>>
`,

    diagnosis: `You are a medical NLP extraction engine.

TASK:
Extract all Diagnoses (primary, secondary, working, acute, chronic). Output as plain text list separated by '/'. No HTML or JSON.
If none, output empty string.

INPUT:
<<TRANSCRIPT>>
{{transcript}}
<<END>>`,

    course_of_stay: `You are a medical NLP extraction engine.

TASK:
Extract Course of Stay. Include all major events, interventions, consultations, dates normalized to DD-MM-YYYY. Output plain text paragraphs. No HTML or JSON.
Empty string if none.

INPUT:
<<TRANSCRIPT>>
{{transcript}}
<<END>>`,

    past_history: `You are a medical NLP extraction engine.

TASK:
Extract the patient’s Past Medical History (PMH) from the transcript. Include:
- Chronic illnesses, past surgeries, prior hospitalizations, relevant medical events
- Duration of each condition if explicitly mentioned

OUTPUT:
- Output as plain text, items separated by '/'.
- Include duration with the condition if available (e.g., "Hypertension for 5 years").
- No HTML or JSON.
- Empty string if none.

INPUT:
<<TRANSCRIPT>>
{{transcript}}
<<END>>
`,

    present_medical_illness: `You are a medical NLP extraction engine.

TASK:
Extract HPI. Output plain text paragraph. No HTML or JSON. Empty string if none.

INPUT:
<<TRANSCRIPT>>
{{transcript}}
<<END>>`,

    medications: `You are a medical NLP extraction engine.

TASK:
Extract all medications. Return strict JSON as defined:

{
  "medications_found": true or false,
  "medications": [
    {
      "name": "",
      "dosage": "",
      "route": "",
      "frequency": "",
      "duration": "",
      "indication": ""
    }
  ]
}

Empty if none.

INPUT:
<<TRANSCRIPT>>
{{transcript}}
<<END>>`,

    death_summary: `You are a medical NLP extraction engine.

TASK:
Extract Death Summary. Output plain text paragraph. No HTML or JSON. Empty if none.

INPUT:
<<TRANSCRIPT>>
{{transcript}}
<<END>>`,

    investigations: `You are a medical NLP extraction engine.

TASK:
Extract Investigations and Lab Results. Output as plain text paragraph. Empty if none.

INPUT:
<<TRANSCRIPT>>
{{transcript}}
<<END>>`,

    procedures: `You are a medical NLP extraction engine.

TASK:
Extract Procedures performed or planned. Output as plain text paragraph. Empty if none.

INPUT:
<<TRANSCRIPT>>
{{transcript}}
<<END>>`,

    vitals: `You are a medical NLP extraction engine.

TASK:
Extract Vitals. Output as plain text paragraph. Empty if none.

INPUT:
<<TRANSCRIPT>>
{{transcript}}
<<END>>`,

    allergies: `You are a medical NLP extraction engine.

TASK:
Extract Allergies. Output as plain text paragraph. Empty if none.

INPUT:
<<TRANSCRIPT>>
{{transcript}}
<<END>>`,

    follow_up: `You are a medical NLP extraction engine.

TASK:
Extract Follow-Up instructions from the transcript.

OUTPUT RULES (STRICT):
1. First output one clean paragraph summarizing the follow-up instructions.
2. IF any medications/tablets/capsules/syrups/injections are mentioned, output a STRICT Markdown table immediately after the paragraph.
3. The table MUST follow exactly this structure and formatting:

| name | type | dosage | timing | duration | additional_instructions |
| ...  | ...  | ...    | ...    | ...      | ...                     |

4. No extra spaces, labels, titles, bullets, or explanations.
5. Do NOT wrap the table in code blocks.
6. If no medications are mentioned, output ONLY the paragraph.

COLUMN DEFINITIONS:
- name: medication name only
- type: tablet/syrup/capsule/injection/etc.
- dosage: numeric strength (e.g., "500 mg")
- timing: when it should be taken (e.g., "once daily after food")
- duration: number of days or duration specified
- additional_instructions: any extra notes

INPUT:
<<TRANSCRIPT>>
{{transcript}}
<<END>>`


};
