// Fixed WhatsApp lead link for Chess Empire (chessempire.kz).
// Every primary / trial / contact CTA and the trial form submit opens exactly this URL
// in a new tab. The message text is fixed per the client — do not template it per-field.
export const WHATSAPP_LEAD_URL =
  'https://api.whatsapp.com/send/?phone=77077872210&text=%D0%97%D0%B4%D1%80%D0%B0%D0%B2%D1%81%D1%82%D0%B2%D1%83%D0%B9%D1%82%D0%B5%21%0A%0A%D0%9F%D0%B8%D1%88%D1%83+%D0%B8%D0%B7+%D0%BF%D1%80%D0%B8%D0%BB%D0%BE%D0%B6%D0%B5%D0%BD%D0%B8%D1%8F+2%D0%93%D0%98%D0%A1.%0A%0A&type=phone_number&app_absent=0'

// Opens the WhatsApp lead link in a new tab (used by the trial form submit).
export function openWhatsAppLead(): void {
  window.open(WHATSAPP_LEAD_URL, '_blank', 'noopener,noreferrer')
}
