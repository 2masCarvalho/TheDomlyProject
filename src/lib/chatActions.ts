/**
 * Shared types for chat actions — structured markers the chat edge function
 * embeds in its response so the React UI can render inline buttons that
 * either link to a page or trigger client-side PDF generation.
 */

export type ChatAction =
  | {
      type: 'open_report';
      report_id: string;
      label?: string;
    }
  | {
      type: 'building_pdf';
      condo_id: number;
      condo_name: string;
      label?: string;
    };
