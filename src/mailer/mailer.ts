import fs from 'fs';
import nodemailer from 'nodemailer';
import { Database } from 'sqlite';
import { AppConfig } from '../config';
import { Job } from '../types';
import { logOutreach, updateJobStatus, updateProfileJobStatus } from '../db/database';

import { UserSettings } from '../types';

export function createTransporter(config: AppConfig, smtpOverrides?: UserSettings['smtp']) {
  const host = (smtpOverrides && smtpOverrides.host) || config.smtp.host;
  const port = (smtpOverrides && smtpOverrides.port) || config.smtp.port;
  const secure = (smtpOverrides && typeof smtpOverrides.secure === 'boolean') ? smtpOverrides.secure : config.smtp.secure;
  const user = (smtpOverrides && smtpOverrides.user) || config.smtp.user;
  const pass = (smtpOverrides && smtpOverrides.pass) || config.smtp.pass;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });
}

export async function testSmtpConnection(
  config: AppConfig,
  smtpOverrides?: UserSettings['smtp']
): Promise<{ success: boolean; message: string }> {
  try {
    const transporter = createTransporter(config, smtpOverrides);
    await transporter.verify();
    return { success: true, message: 'SMTP connection verified successfully!' };
  } catch (err: any) {
    return { success: false, message: `SMTP verification failed: ${err.message}` };
  }
}

export async function sendPitchEmail(
  db: Database,
  job: Job,
  config: AppConfig,
  smtpOverrides?: UserSettings['smtp'],
  profileId?: string
): Promise<{ success: boolean; message: string }> {
  if (!job.recruiter_email) {
    return { success: false, message: 'No recruiter email address found for this job.' };
  }

  const transporter = createTransporter(config, smtpOverrides);
  const fromName = (smtpOverrides && smtpOverrides.from_name) || config.smtp.fromName || config.candidateProfile.name;
  const fromUser = (smtpOverrides && smtpOverrides.user) || config.smtp.user;
  const cvPath = config.paths.cvAttachment;

  const attachments: any[] = [];
  if (fs.existsSync(cvPath)) {
    const safeName = config.candidateProfile.name.replace(/\s+/g, '_');
    attachments.push({
      filename: `${safeName}_CV.pdf`,
      path: cvPath,
    });
  } else {
    console.warn(`[Mailer] CV file not found at ${cvPath}. Sending email without attachment.`);
  }

  const subject = job.email_subject || `Application: ${job.title} - ${config.candidateProfile.name}`;
  const body = job.tailored_pitch || `Hi,\n\nI am interested in the ${job.title} role at ${job.company}. Please find my CV attached.\n\nBest regards,\n${config.candidateProfile.name}`;

  try {
    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromUser}>`,
      to: job.recruiter_email,
      subject,
      text: body,
      attachments,
    });

    // Record outreach in database
    await logOutreach(db, job.id, job.recruiter_email, subject, 'sent');
    await updateJobStatus(db, job.id, 'applied');
    if (profileId) {
      await updateProfileJobStatus(db, profileId, job.id, 'applied');
    }

    return {
      success: true,
      message: `Email successfully sent to ${job.recruiter_email} (Message ID: ${info.messageId})`,
    };
  } catch (err: any) {
    await logOutreach(db, job.id, job.recruiter_email, subject, 'error', err.message);
    return {
      success: false,
      message: `Failed to dispatch email: ${err.message}`,
    };
  }
}

export async function sendLiveTestEmail(
  config: AppConfig,
  recipient: string,
  subject: string,
  body: string,
  attachCv: boolean = false,
  smtpOverrides?: UserSettings['smtp']
): Promise<{ success: boolean; message: string; messageId?: string }> {
  if (!recipient || !recipient.includes('@')) {
    return { success: false, message: 'Please provide a valid recipient email address.' };
  }

  const transporter = createTransporter(config, smtpOverrides);
  const fromName = (smtpOverrides && smtpOverrides.from_name) || config.smtp.fromName || config.candidateProfile.name;
  const fromUser = (smtpOverrides && smtpOverrides.user) || config.smtp.user;

  const attachments: any[] = [];
  if (attachCv && fs.existsSync(config.paths.cvAttachment)) {
    const safeName = config.candidateProfile.name.replace(/\s+/g, '_');
    attachments.push({
      filename: `${safeName}_CV.pdf`,
      path: config.paths.cvAttachment,
    });
  }

  try {
    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromUser}>`,
      to: recipient,
      subject: subject || '[GetHired Test] Live Outbound Verification',
      text: body || 'Hello! This is a live test email dispatched from your GetHired Copilot.',
      attachments,
    });

    return {
      success: true,
      message: `Test email sent successfully to ${recipient}! (Message ID: ${info.messageId})`,
      messageId: info.messageId,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Failed to dispatch test email: ${err.message}`,
    };
  }
}

