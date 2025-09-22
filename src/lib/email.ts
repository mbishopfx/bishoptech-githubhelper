import nodemailer from 'nodemailer';
import { supabase } from './supabase';
import { getSingleUserId } from './single-user';

export interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export interface EmailData {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  html?: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
}

export interface EmailSettings {
  smtp_host: string;
  smtp_port: number;
  smtp_secure: boolean;
  smtp_user: string;
  smtp_password: string;
  sender_name: string;
  sender_email: string;
  logo_url: string;
  company_name: string;
  primary_color: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private settings: EmailSettings | null = null;

  async initialize() {
    const userId = getSingleUserId();
    const { data: emailSettings, error } = await supabase
      .from('email_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Failed to load email settings:', error);
      throw new Error('Email settings not configured');
    }

    this.settings = emailSettings;
    
    // Create transporter with settings
    this.transporter = nodemailer.createTransporter({
      host: emailSettings.smtp_host,
      port: emailSettings.smtp_port,
      secure: emailSettings.smtp_secure,
      auth: {
        user: emailSettings.smtp_user,
        pass: emailSettings.smtp_password,
      },
    });

    return this;
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      if (!this.transporter) {
        await this.initialize();
      }

      await this.transporter!.verify();
      return { success: true, message: 'SMTP connection verified successfully' };
    } catch (error: any) {
      console.error('SMTP connection failed:', error);
      return { success: false, message: `Connection failed: ${error.message}` };
    }
  }

  async sendEmail(emailData: EmailData): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      if (!this.transporter) {
        await this.initialize();
      }

      if (!this.settings) {
        throw new Error('Email settings not loaded');
      }

      const mailOptions = {
        from: `"${this.settings.sender_name}" <${this.settings.sender_email}>`,
        to: Array.isArray(emailData.to) ? emailData.to.join(', ') : emailData.to,
        cc: emailData.cc ? (Array.isArray(emailData.cc) ? emailData.cc.join(', ') : emailData.cc) : undefined,
        bcc: emailData.bcc ? (Array.isArray(emailData.bcc) ? emailData.bcc.join(', ') : emailData.bcc) : undefined,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text,
        attachments: emailData.attachments,
      };

      const info = await this.transporter!.sendMail(mailOptions);
      console.log('Email sent successfully:', info.messageId);
      
      return { success: true, messageId: info.messageId };
    } catch (error: any) {
      console.error('Failed to send email:', error);
      return { success: false, error: error.message };
    }
  }

  async queueEmail(emailData: EmailData, priority: number = 5, scheduledFor?: Date) {
    const userId = getSingleUserId();
    
    try {
      const { data, error } = await supabase
        .from('email_queue')
        .insert({
          user_id: userId,
          to_emails: Array.isArray(emailData.to) ? emailData.to : [emailData.to],
          cc_emails: emailData.cc ? (Array.isArray(emailData.cc) ? emailData.cc : [emailData.cc]) : [],
          bcc_emails: emailData.bcc ? (Array.isArray(emailData.bcc) ? emailData.bcc : [emailData.bcc]) : [],
          subject: emailData.subject,
          html_content: emailData.html || '',
          text_content: emailData.text || '',
          priority,
          scheduled_for: scheduledFor || new Date(),
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return { success: true, queueId: data.id };
    } catch (error: any) {
      console.error('Failed to queue email:', error);
      return { success: false, error: error.message };
    }
  }

  async processEmailQueue() {
    try {
      const { data: queuedEmails, error } = await supabase
        .from('email_queue')
        .select('*')
        .eq('status', 'pending')
        .lte('scheduled_for', new Date().toISOString())
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(10);

      if (error) {
        throw error;
      }

      if (!queuedEmails || queuedEmails.length === 0) {
        return { processed: 0 };
      }

      let processed = 0;
      let errors = 0;

      for (const email of queuedEmails) {
        try {
          // Update status to sending
          await supabase
            .from('email_queue')
            .update({ status: 'sending', attempts: email.attempts + 1 })
            .eq('id', email.id);

          const result = await this.sendEmail({
            to: email.to_emails,
            cc: email.cc_emails.length > 0 ? email.cc_emails : undefined,
            bcc: email.bcc_emails.length > 0 ? email.bcc_emails : undefined,
            subject: email.subject,
            html: email.html_content,
            text: email.text_content,
          });

          if (result.success) {
            // Update status to sent
            await supabase
              .from('email_queue')
              .update({ 
                status: 'sent', 
                sent_at: new Date().toISOString(),
                error_message: null 
              })
              .eq('id', email.id);
            processed++;
          } else {
            // Handle failure
            const shouldRetry = email.attempts < 3;
            await supabase
              .from('email_queue')
              .update({ 
                status: shouldRetry ? 'retry' : 'failed',
                error_message: result.error,
                scheduled_for: shouldRetry 
                  ? new Date(Date.now() + Math.pow(2, email.attempts) * 60000).toISOString() // Exponential backoff
                  : email.scheduled_for
              })
              .eq('id', email.id);
            errors++;
          }
        } catch (error: any) {
          console.error(`Failed to process email ${email.id}:`, error);
          await supabase
            .from('email_queue')
            .update({ 
              status: 'failed',
              error_message: error.message 
            })
            .eq('id', email.id);
          errors++;
        }
      }

      return { processed, errors };
    } catch (error: any) {
      console.error('Failed to process email queue:', error);
      throw error;
    }
  }
}

// Template rendering utility
export class EmailTemplateRenderer {
  static render(template: string, variables: Record<string, any>): string {
    let rendered = template;
    
    // Simple template variable replacement
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      rendered = rendered.replace(regex, String(value || ''));
    }

    // Handle arrays (simple each loop)
    rendered = rendered.replace(/{{#each\s+(\w+)}}([\s\S]*?){{\/each}}/g, (match, arrayKey, content) => {
      const array = variables[arrayKey];
      if (Array.isArray(array)) {
        return array.map(item => {
          let itemContent = content;
          if (typeof item === 'string') {
            itemContent = itemContent.replace(/{{this}}/g, item);
          } else if (typeof item === 'object') {
            for (const [itemKey, itemValue] of Object.entries(item)) {
              itemContent = itemContent.replace(new RegExp(`{{${itemKey}}}`, 'g'), String(itemValue || ''));
            }
          }
          return itemContent;
        }).join('');
      }
      return '';
    });

    return rendered;
  }

  static async getTemplate(templateId: string) {
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('id', templateId)
      .eq('is_active', true)
      .single();

    if (error) {
      throw new Error(`Template not found: ${error.message}`);
    }

    return data;
  }

  static async renderTemplate(templateId: string, variables: Record<string, any>) {
    const template = await this.getTemplate(templateId);
    
    return {
      subject: this.render(template.subject, variables),
      html: this.render(template.html_content, variables),
      text: template.text_content ? this.render(template.text_content, variables) : undefined,
    };
  }
}

// Export singleton instance
export const emailService = new EmailService();
