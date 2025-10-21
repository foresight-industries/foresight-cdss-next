import { GoogleGenAI } from '@google/genai';

export async function POST(request: Request) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return Response.json({ error: 'API key not configured' }, { status: 500 });
    }

    const formData = await request.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return Response.json({ error: 'No image file provided' }, { status: 400 });
    }

    const genAI = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    // Convert file to base64 for Gemini
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');

    const prompt = `
    Analyze this insurance card image and extract the following information:

    1. Member/Subscriber Name
    2. Member ID/Subscriber ID
    3. Group Number
    4. Plan Name
    5. Insurance Company Name
    6. Effective Date
    7. Copay Information (all types like PCP, Specialist, ER, etc.)
    8. Deductible
    9. RX BIN (prescription benefit identification number)
    10. RX PCN (processor control number)
    11. RX Group

    Format the response as a JSON object with these fields:
    {
        "member_name": "extracted name or null",
        "member_id": "extracted ID or null",
        "group_number": "extracted group number or null",
        "plan_name": "extracted plan name or null",
        "insurance_company": "extracted company name or null",
        "effective_date": "extracted date or null",
        "copay_info": {
            "pcp": "amount or null",
            "specialist": "amount or null",
            "er": "amount or null",
            "urgent_care": "amount or null"
        },
        "deductible": "extracted deductible or null",
        "rx_bin": "extracted BIN or null",
        "rx_pcn": "extracted PCN or null",
        "rx_group": "extracted RX group or null",
        "raw_text": "all text visible on the card"
    }

    If any field is not found on the card, use null for that field.
    `;

    const result = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        prompt,
        { inlineData: { data: base64, mimeType: file.type } }
      ]
    });

    const responseText = result.text?.trim();

    if (!responseText) {
      return Response.json(
        { error: 'Failed to extract insurance card data' },
        { status: 500 }
      );
    }

    // Clean JSON response
    let cleanText = responseText;
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.slice(7);
    }
    if (cleanText.endsWith('```')) {
      cleanText = cleanText.slice(0, -3);
    }

    const extractedData = JSON.parse(cleanText.trim());

    return Response.json(extractedData);

  } catch (error) {
    console.error('OCR extraction error:', error);
    return Response.json(
      { error: 'Failed to extract insurance card data' },
      { status: 500 }
    );
  }
}
