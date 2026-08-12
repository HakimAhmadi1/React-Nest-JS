export class EmailNotificationDto {
  from?: string;
  to: string;
  subject: string;
  text: string;
  html?: string;
}
