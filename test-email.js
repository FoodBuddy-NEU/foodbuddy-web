// Simple script to test email configuration
require('dotenv').config({ path: '.env.local' });
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER?.trim(),
    pass: process.env.EMAIL_PASSWORD?.trim(),
  },
});

console.log('Testing email configuration...');
console.log('Email User:', process.env.EMAIL_USER);
console.log('Email Password:', process.env.EMAIL_PASSWORD ? '***' : 'NOT SET');

transporter.verify((error, success) => {
  if (error) {
    console.log('❌ Email configuration error:', error);
  } else {
    console.log('✅ Email configuration is valid!');
    
    // Try sending a test email
    transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: 'chen.yu25@northeastern.edu',
      subject: 'FoodBuddy Test Email',
      html: '<h1>Test Email</h1><p>If you receive this, the email configuration is working!</p>',
    }, (err, info) => {
      if (err) {
        console.log('❌ Failed to send test email:', err);
      } else {
        console.log('✅ Test email sent successfully:', info.response);
      }
      process.exit(0);
    });
  }
});
