import { EmailTemplate } from '@/components/shared/email-templates/reset-password';
import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY is not set');
}

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { email, firstName = 'user', redirectTo = '/' } = await req.json();

    if (!email || !redirectTo) {
      return Response.json({ error: 'Missing email param' }, { status: 404 });
    }

    const { data, error } = await resend.emails.send({
      from: 'Foresight <team@have-foresight.app>',
      to: [email],
      subject: 'Reset your password for Foresight',
      react: EmailTemplate({ firstName, resetUrl: redirectTo }),
    });

    if (error) {
      return Response.json({ error }, { status: 500 });
    }

    return Response.json(data);
  } catch (error) {
    return Response.json({ error }, { status: 500 });
  }
}
