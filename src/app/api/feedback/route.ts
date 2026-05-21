import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, type, rating, message } = body;

    // Simple validation
    if (!message || message.trim().length < 10) {
      return NextResponse.json(
        { success: false, error: 'Message must be at least 10 characters long' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    const feedbackData = {
      name: name?.trim() || 'Anonymous',
      email: email?.trim() || 'Not provided',
      type: type || 'general',
      rating,
      message: message.trim(),
      timestamp: new Date().toISOString(),
    };

    const resendApiKey = process.env.RESEND_API_KEY;
    const emailTo = process.env.FEEDBACK_EMAIL_TO;

    if (resendApiKey) {
      // Send real email using Resend API via zero-dependency native fetch
      const emailBody = {
        from: 'DevTools Pro Feedback <feedback@resend.dev>', // Resend sandbox default from address
        to: emailTo,
        subject: `[DevTools Pro] ${feedbackData.type.toUpperCase()} (${feedbackData.rating}/5★) from ${feedbackData.name}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff; color: #1f2937;">
            <div style="background: linear-gradient(135deg, #06b6d4 0%, #8b5cf6 100%); padding: 20px; border-radius: 8px 8px 0 0; text-align: center; color: #ffffff;">
              <h1 style="margin: 0; font-size: 24px;">New Feedback Received!</h1>
              <p style="margin: 5px 0 0 0; opacity: 0.9;">DevTools Pro Developer Utilities Platform</p>
            </div>
            
            <div style="padding: 20px;">
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; font-weight: bold; color: #4b5563; width: 120px;">Sender:</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6;">${feedbackData.name}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; font-weight: bold; color: #4b5563;">Email:</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6;">${feedbackData.email}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; font-weight: bold; color: #4b5563;">Type:</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6;"><span style="background-color: #ede9fe; color: #6d28d9; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; text-transform: uppercase;">${feedbackData.type}</span></td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; font-weight: bold; color: #4b5563;">Rating:</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; color: #f59e0b; font-size: 16px;">${'★'.repeat(feedbackData.rating)}${'☆'.repeat(5 - feedbackData.rating)} (${feedbackData.rating}/5)</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; font-weight: bold; color: #4b5563;">Submitted:</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; font-size: 13px; color: #6b7280;">${new Date(feedbackData.timestamp).toLocaleString()}</td>
                </tr>
              </table>

              <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; border-left: 4px solid #8b5cf6; margin-top: 10px;">
                <h4 style="margin: 0 0 10px 0; color: #4b5563; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em;">Message</h4>
                <p style="margin: 0; line-height: 1.6; white-space: pre-wrap; font-size: 15px;">${feedbackData.message}</p>
              </div>
            </div>
            
            <div style="border-t: 1px solid #e5e7eb; padding: 15px 20px 0 20px; text-align: center; font-size: 12px; color: #9ca3af;">
              This email was automatically generated and sent from DevTools Pro.
            </div>
          </div>
        `,
      };

      const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify(emailBody),
      });

      if (!emailResponse.ok) {
        const errText = await emailResponse.text();
        console.error('Failed to send email via Resend:', errText);
        // Fallback: log to console but still succeed locally
        console.log('Logged feedback (Resend API failed):', feedbackData);
        return NextResponse.json({
          success: true,
          message: 'Feedback received, but email delivery failed. Saved in server logs.',
        });
      }

      return NextResponse.json({
        success: true,
        message: 'Feedback received and sent via email successfully!',
      });
    }

    // Default mock behavior if no Resend API key is configured
    console.log('\n--- NEW FEEDBACK RECEIVED ---');
    console.log(`Sender:    ${feedbackData.name} (${feedbackData.email})`);
    console.log(`Type:      ${feedbackData.type.toUpperCase()}`);
    console.log(`Rating:    ${feedbackData.rating}/5 Stars`);
    console.log(`Message:   ${feedbackData.message}`);
    console.log(`Timestamp: ${feedbackData.timestamp}`);
    console.log('------------------------------\n');

    return NextResponse.json({
      success: true,
      message: 'Feedback logged successfully on Next.js server console!',
      warning: 'Configure RESEND_API_KEY in your env file to receive actual email alerts.',
    });
  } catch (error) {
    console.error('Error in feedback route handler:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error while processing feedback' },
      { status: 500 }
    );
  }
}
