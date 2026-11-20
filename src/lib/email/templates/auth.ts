import { renderBaseEmailLayout } from "@/lib/email/baseEmail";

export function getEmailVerificationTemplate(verifyUrl: string): string {
  const content = `
    <h2 style="color: #2863FD; margin-bottom: 1rem;">Confirmação de Email Alternativo</h2>
    <p style="font-size: 1.1rem;">Olá!</p>
    <p>Recebemos um pedido para adicionar este email como contacto alternativo na tua conta NEIIST.</p>
    <div style="margin: 2rem 0;">
      <a href="${verifyUrl}" style="background: linear-gradient(90deg,#2863FD 0%,#34D1F9 100%); color: #fff; padding: 0.9em 2em; border-radius: 0.5em; text-decoration: none; font-weight: bold; font-size: 1.1rem; box-shadow: 0 2px 8px rgba(40,99,253,0.08); display: inline-block;">
        Confirmar Email
      </a>
    </div>
    <p style="color: #555;">Se não fizeste este pedido, ignora este email.</p>
  `;
  return renderBaseEmailLayout({ content });
}

export function getAccountDeletionTemplate(name: string): string {
  const content = `
    <h2 style="color: #2863FD; margin-bottom: 1rem;">Conta Eliminada</h2>
    <p style="font-size: 1.1rem;">Olá ${name}!</p>
    <p>Confirmamos que a tua conta no NEIIST e os teus dados pessoais foram eliminados com sucesso, conforme o RGPD (Direito ao Apagamento).</p>
    <p style="color: #555; font-size: 0.95rem; margin-top: 1rem;">
      <strong>Nota informativa:</strong> Caso tenhas realizado encomendas na nossa loja, os registos fiscais correspondentes são mantidos durante o período legal obrigatório de 10 anos (art.º 52.º da Lei Geral Tributária), findo o qual serão totalmente removidos.
    </p>
    <p style="margin-top: 1rem;">Se não solicitaste esta eliminação ou tens alguma dúvida, por favor contacta a nossa equipa.</p>
  `;
  return renderBaseEmailLayout({ content });
}
