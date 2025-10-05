import * as React from 'react';

interface ResetPasswordEmailProps {
  firstName?: string;
  resetUrl: string;
  expirationTime?: string;
}

export const EmailTemplate: React.FC<Readonly<ResetPasswordEmailProps>> = ({
  firstName = 'User',
  resetUrl,
  expirationTime = '1 hour',
}) => (
  <div style={{
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    lineHeight: '1.6',
    color: '#333333',
    maxWidth: '600px',
    margin: '0 auto',
    backgroundColor: '#ffffff',
  }}>
    {/* Header */}
    <div style={{
      backgroundColor: '#2563eb',
      padding: '32px 24px',
      textAlign: 'center' as const,
    }}>
      <img 
        src="https://your-domain.com/android-chrome-192x192.png" 
        alt="Foresight RCM" 
        style={{
          width: '48px',
          height: '48px',
          marginBottom: '16px',
        }}
      />
      <h1 style={{
        color: '#ffffff',
        margin: '0',
        fontSize: '24px',
        fontWeight: '600',
      }}>
        Reset Your Password
      </h1>
    </div>

    {/* Main Content */}
    <div style={{ padding: '32px 24px' }}>
      <h2 style={{
        fontSize: '20px',
        fontWeight: '600',
        margin: '0 0 16px 0',
        color: '#1f2937',
      }}>
        Hello {firstName},
      </h2>

      <p style={{
        fontSize: '16px',
        margin: '0 0 24px 0',
        color: '#4b5563',
      }}>
        We received a request to reset the password for your Foresight RCM account. 
        If you made this request, click the button below to reset your password.
      </p>

      {/* Reset Button */}
      <div style={{ textAlign: 'center' as const, margin: '32px 0' }}>
        <a 
          href={resetUrl}
          style={{
            display: 'inline-block',
            backgroundColor: '#2563eb',
            color: '#ffffff',
            padding: '14px 32px',
            textDecoration: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Reset Password
        </a>
      </div>

      <p style={{
        fontSize: '14px',
        margin: '24px 0',
        color: '#6b7280',
        backgroundColor: '#f9fafb',
        padding: '16px',
        borderRadius: '6px',
        border: '1px solid #e5e7eb',
      }}>
        <strong>Security Notice:</strong> This link will expire in {expirationTime}. 
        If you didn't request this password reset, you can safely ignore this email. 
        Your password will remain unchanged.
      </p>

      <p style={{
        fontSize: '14px',
        margin: '16px 0',
        color: '#6b7280',
      }}>
        If the button above doesn't work, copy and paste this link into your browser:
      </p>
      
      <div style={{
        backgroundColor: '#f3f4f6',
        padding: '12px',
        borderRadius: '4px',
        fontSize: '12px',
        color: '#374151',
        wordBreak: 'break-all' as const,
        fontFamily: 'monospace',
      }}>
        {resetUrl}
      </div>

      <div style={{
        borderTop: '1px solid #e5e7eb',
        marginTop: '32px',
        paddingTop: '24px',
      }}>
        <h3 style={{
          fontSize: '16px',
          fontWeight: '600',
          margin: '0 0 12px 0',
          color: '#1f2937',
        }}>
          Need Help?
        </h3>
        <p style={{
          fontSize: '14px',
          margin: '0 0 8px 0',
          color: '#6b7280',
        }}>
          If you're having trouble or didn't request this reset, please contact our support team:
        </p>
        <p style={{
          fontSize: '14px',
          margin: '0',
          color: '#6b7280',
        }}>
          Email: <a href="mailto:support@have-foresight.com" style={{ color: '#2563eb', textDecoration: 'none' }}>support@have-foresight.com</a>
        </p>
      </div>
    </div>

    {/* Footer */}
    <div style={{
      backgroundColor: '#f9fafb',
      padding: '24px',
      textAlign: 'center' as const,
      borderTop: '1px solid #e5e7eb',
    }}>
      <p style={{
        fontSize: '12px',
        margin: '0 0 8px 0',
        color: '#6b7280',
      }}>
        © 2025 Foresight Industries. All rights reserved.
      </p>
      <p style={{
        fontSize: '12px',
        margin: '0',
        color: '#9ca3af',
      }}>
        This email was sent from an automated system. Please do not reply to this email.
      </p>
      <div style={{ marginTop: '16px' }}>
        <a href="https://have-foresight.com/privacy" style={{
          fontSize: '12px',
          color: '#6b7280',
          textDecoration: 'none',
          margin: '0 8px',
        }}>
          Privacy Policy
        </a>
        <a href="https://have-foresight.com/terms" style={{
          fontSize: '12px',
          color: '#6b7280',
          textDecoration: 'none',
          margin: '0 8px',
        }}>
          Terms of Service
        </a>
      </div>
    </div>
  </div>
);

export default EmailTemplate;