import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { EmailNotificationDto } from '@common/dto/email-notification.dto';

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private from: string;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const host = this.config.get<string>('SMTP_HOST');
    this.from = this.config.get<string>('SMTP_FROM') ?? 'no-reply@example.com';

    if (!host) {
      // A fresh clone has no SMTP credentials; log instead of throwing so
      // `forgot-password` still works end-to-end in development.
      this.logger.warn(
        'SMTP_HOST is not configured — emails will be logged to the console instead of sent.',
      );
      return;
    }

    const port = Number(this.config.get<number>('SMTP_PORT') ?? 587);
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: user && pass ? { user, pass } : undefined,
    });
  }

  async send(email: EmailNotificationDto): Promise<void> {
    const message = {
      from: email.from ?? this.from,
      to: email.to,
      subject: email.subject,
      text: email.text,
      html: email.html,
    };

    if (!this.transporter) {
      this.logger.log(
        `[dev mail] to=${message.to} subject="${message.subject}"\n${message.text}`,
      );
      return;
    }

    try {
      await this.transporter.sendMail(message);
      this.logger.log(`Email sent to ${message.to}`);
    } catch (error) {
      // Swallowed on purpose: a mail outage must not turn a successful
      // password-reset request into a 500 that leaks whether the user exists.
      this.logger.error(
        `Failed to send email to ${message.to}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
