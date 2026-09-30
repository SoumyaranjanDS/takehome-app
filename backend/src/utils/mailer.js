import nodemailer from 'nodemailer';

// We use Ethereal as a mock SMTP server for testing (as allowed by the assignment)
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_PORT === '465', 
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

export const sendOTP = async (email, otp) => {
  try {
    const transporter = createTransporter();
    
    let info = await transporter.sendMail({
      from: `"PadosiPro Auth" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Your PadosiPro Verification Code",
      text: `Your verification code is: ${otp}. It expires in 10 minutes.`,
      html: `<b>Your verification code is: ${otp}</b><p>It expires in 10 minutes.</p>`,
    });

    console.log("Message sent: %s", info.messageId);
    // Preview only available when sending through an Ethereal account
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    return true;
  } catch (error) {
    console.error("Error sending email", error);
    return false;
  }
};
