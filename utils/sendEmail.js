import nodemailer from "nodemailer";

const sendEmail = async function (to, subject, text) {
  const transport = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transport.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    text,
  });
};

export default sendEmail;
